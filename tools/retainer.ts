import Stripe from 'stripe'
import { sql } from '../lib/db'
import { send as realSend } from './email'
import { checkout as realCheckout } from './stripe'

// The $49/mo retainer ("Hire Chad"). One-click off-session charge on the card saved at the $5/$12 checkout; if there's
// no usable saved card (or SCA is needed) we fall back to hosted Checkout — never a dead end. Revenue is booked on the
// subscription's `invoice.paid` webhook (NOT checkout.session.completed), so the off-session and hosted paths unify.
// Stripe ids are mode-scoped and test (local) + live (prod) share ONE db, so we only reuse a saved customer/sub whose
// mode matches the running key.

const isLive = () => !!process.env.STRIPE_SECRET_KEY?.startsWith('sk_live')

type HireDeps = {
  createSub: (customerId: string, prospectId: string) => Promise<{ subId: string }> // throws unless the first charge clears immediately
  checkout49: (prospectId: string, customer: string | null) => Promise<{ url: string }>
  activeSub?: (customerId: string) => Promise<string | null> // an existing non-terminal subscription on this customer, if any
}
export type HireResult = { status: 'subscribed' | 'already' | 'fallback'; url?: string }

const DEFAULT_HIRE: HireDeps = {
  // Stripe is the source of truth for "already subscribed" — our stripe_sub column can lag (invoice.paid webhook delay)
  // or get released when an off-session charge fails, so we ask Stripe before ever creating a 2nd sub on the customer.
  activeSub: async (customerId) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 })
    const active = subs.data.find((s) => ['active', 'trialing', 'past_due', 'unpaid'].includes(s.status))
    return active?.id ?? null
  },
  createSub: async (customerId, prospectId) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const sub = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: process.env.STRIPE_PRICE_RETAINER! }],
      off_session: true,
      payment_behavior: 'error_if_incomplete', // first charge must clear now, else throw → we fall back to hosted Checkout
      metadata: { prospect: prospectId }, // so invoice.paid can resolve the prospect
    })
    return { subId: sub.id }
  },
  checkout49: async (prospectId, customer) => realCheckout({ prospect: prospectId, tier: 49, customer }),
}

/** One-click hire: charge the saved card for $49/mo, or hand back a hosted-Checkout url. Idempotent (one sub/prospect). */
export async function hireChad(prospectId: string, deps: HireDeps = DEFAULT_HIRE): Promise<HireResult> {
  const [p] = await sql<any[]>`select stripe_customer, stripe_sub, stripe_livemode from prospects where id=${prospectId}`
  const live = isLive()
  const sameMode = !!p && p.stripe_livemode === live // a customer/sub from the other Stripe mode is unusable with this key
  if (sameMode && p.stripe_sub) return { status: 'already' } // already on retainer — never double-charge
  const customer: string | null = sameMode ? (p?.stripe_customer ?? null) : null
  if (!customer) return { status: 'fallback', url: (await deps.checkout49(prospectId, customer)).url }
  // Authoritative dedup: even when our stripe_sub column is stale/null, never stack a 2nd subscription on a customer
  // that already has one in Stripe (the "every click makes a new sub" bug). Backfill the column so the next click is cheap.
  const existing = deps.activeSub ? await deps.activeSub(customer) : null
  if (existing) {
    await sql`update prospects set stripe_sub=${existing}, stripe_livemode=${live}, stage='member' where id=${prospectId}`
    return { status: 'already' }
  }
  // Atomic claim: only ONE concurrent call flips stripe_sub null → 'pending', so a double-submit / retry can't create
  // two subscriptions ($98/mo). Lost the race (or already subscribing) → 'already', never start a second charge.
  const claim = await sql<any[]>`update prospects set stripe_sub='pending' where id=${prospectId} and stripe_sub is null returning id`
  if (claim.length === 0) return { status: 'already' }
  let subId: string
  try { subId = (await deps.createSub(customer, prospectId)).subId }
  catch {
    await sql`update prospects set stripe_sub=null where id=${prospectId} and stripe_sub='pending'` // release the claim
    return { status: 'fallback', url: (await deps.checkout49(prospectId, customer)).url } // SCA / decline → hosted Checkout
  }
  await sql`update prospects set stripe_sub=${subId}, stripe_livemode=${live}, stage='member' where id=${prospectId}`
  return { status: 'subscribed' }
}

type BookDeps = { send: typeof realSend }
type InvoiceFacts = { invoiceId: string; prospectId: string | null; email: string | null; amountCents: number; firstInvoice: boolean; livemode: boolean }

/** Book one paid retainer invoice (from the subscription invoice webhook): order + revenue + feed, email on the first.
 *  Idempotent + race-safe: the order insert relies on the unique index on orders.stripe_id, and order/ledger/feed are
 *  one transaction (no partial booking). The confirmation email is best-effort AFTER commit (a send failure must not
 *  roll back — or, via webhook retry, silently drop — the revenue). */
export async function bookRetainerInvoice(inv: InvoiceFacts, deps: BookDeps = { send: realSend }): Promise<'booked' | 'skipped'> {
  const booked = await sql.begin(async (tx) => {
    const ins = await tx`insert into orders (prospect_id, tier, stripe_id, buyer_email, amount, status, livemode)
              values (${inv.prospectId}, 49, ${inv.invoiceId}, ${inv.email}, ${inv.amountCents}, 'paid', ${inv.livemode})
              on conflict (stripe_id) do nothing returning id`
    if (ins.length === 0) return false // already booked (retry / the dual invoice events) → idempotent no-op
    await tx`insert into ledger (kind, amount_cents, note, livemode) values ('revenue', ${inv.amountCents}, ${'retainer ' + inv.invoiceId}, ${inv.livemode})`
    if (inv.livemode && inv.prospectId) // public "hired" feed event only for REAL (live-mode) subscriptions
      await tx`insert into interactions (prospect_id, channel, direction, ref, text) values (${inv.prospectId}, 'retainer', 'out', ${inv.invoiceId}, 'hired Chad — $49/mo')`
    if (inv.firstInvoice && inv.prospectId)
      await tx`update prospects set stage='member' where id=${inv.prospectId}`
    return true
  })
  if (!booked) return 'skipped'
  if (inv.firstInvoice && inv.prospectId && inv.email) {
    const base = process.env.APP_URL || 'https://adchad.ai'
    try {
      await deps.send({
        to: inv.email,
        subject: 'You hired Chad 🔨 — let’s get to work',
        body:
          `You're on. $49/mo, card on file — no more lighting money on fire.\n\n` +
          `First, tell me about your business so I can get to work. Fill this out:\n${base}/onboard/${inv.prospectId}\n\n` +
          `You'll get your first report — a fresh ad, competitor intel, and a read on your current ads — ` +
          `a week from when you submit the form.\n\n— Chad`,
      })
    } catch (e) { console.error('retainer confirmation email failed', e) } // booking already committed; don't fail the webhook
  }
  return 'booked'
}

/** Store the intake answers (one row per prospect — resubmit overwrites); the 1-week clock starts at submission. */
export async function saveOnboarding(prospectId: string, answers: any): Promise<{ ok: true; reportBy: string }> {
  await sql`insert into onboarding (prospect_id, answers, submitted_at) values (${prospectId}, ${sql.json(answers)}, now())
            on conflict (prospect_id) do update set answers=excluded.answers, submitted_at=now()`
  const reportBy = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  return { ok: true, reportBy }
}

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { sql } from '../../../../lib/db'
import { bookRetainerInvoice } from '../../../../tools/retainer'

export const dynamic = 'force-dynamic'

// Paid checkout → record the order + revenue + queue fulfillment. $49/mo subscriptions are booked on invoice.paid (the
// off-session one-click never fires checkout.session.completed). livemode is stamped from the event so test-mode money
// (local dev shares the prod DB) stays off the public P&L/feed and never triggers a real fix.
export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature') || ''
  const body = await req.text() // raw body required for signature verification
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (e: any) {
    return NextResponse.json({ error: `signature: ${e?.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object as Stripe.Checkout.Session
    const prospect = s.metadata?.prospect || null
    const tier = Number(s.metadata?.tier || 5)
    // Persist the saved customer (the $5/$12 checkout saves the card) so the $49/mo upsell can charge off-session.
    // Tag the mode: a test customer and a live customer can't be used interchangeably with the wrong key.
    if (prospect && s.customer) {
      const cust = typeof s.customer === 'string' ? s.customer : s.customer.id
      await sql`update prospects set stripe_customer=${cust}, stripe_livemode=${event.livemode} where id=${prospect}`
    }
    if (s.mode === 'payment') { // one-time $5/$12 booked here; subscriptions are booked on invoice.paid
      const amount = s.amount_total ?? tier * 100
      await sql`insert into orders (prospect_id, tier, stripe_id, buyer_email, amount, status, livemode)
                values (${prospect}, ${tier}, ${s.id}, ${s.customer_details?.email ?? null}, ${amount}, 'paid', ${event.livemode})`
      await sql`insert into ledger (kind, amount_cents, note, livemode) values ('revenue', ${amount}, ${'order ' + s.id}, ${event.livemode})`
      if (event.livemode) // the public "generating…" feed marker only for real orders
        await sql`insert into interactions (prospect_id, channel, direction, ref, text)
                  values (${prospect}, 'note', 'in', ${s.id}, ${`PAID tier ${tier} — fulfill me`})`
    }
  }

  // Retainer subscription paid (off-session one-click OR hosted fallback) — both land here, not on the checkout webhook.
  // Accept both event names (older account API versions emit invoice.payment_succeeded); booking is idempotent on the
  // invoice id, so if both fire for one invoice the second is a no-op.
  if (event.type === 'invoice.paid' || event.type === 'invoice.payment_succeeded') {
    const inv = event.data.object as any
    // `inv.subscription` (pre-Basil) OR `inv.parent.subscription_details.subscription` (Stripe Basil 2025-03-31+ moved it)
    const subRaw = inv.subscription ?? inv.parent?.subscription_details?.subscription
    const subId = typeof subRaw === 'string' ? subRaw : subRaw?.id
    const custId = typeof inv.customer === 'string' ? inv.customer : inv.customer?.id ?? null
    if (subId) {
      let prospect: string | null = null
      try { const sub = await stripe.subscriptions.retrieve(subId); prospect = (sub.metadata?.prospect as string) || null } catch { /* fall through to customer lookup */ }
      if (!prospect && custId) {
        const [p] = await sql<any[]>`select id from prospects where stripe_customer=${custId} limit 1`
        prospect = p?.id ?? null
      }
      // firstInvoice = the prospect has no prior retainer order yet. Computed from our DB (robust to old API versions
      // that omit billing_reason) — drives the one-time confirmation email + recording the sub on the prospect.
      const [prior] = prospect ? await sql<any[]>`select count(*)::int n from orders where prospect_id=${prospect} and tier=49` : [{ n: 0 }]
      const firstInvoice = (prior?.n ?? 0) === 0
      if (firstInvoice && prospect) // record the sub on the prospect (covers the hosted-Checkout fallback path too)
        await sql`update prospects set stripe_sub=${subId}, stripe_customer=coalesce(stripe_customer, ${custId}), stripe_livemode=${event.livemode} where id=${prospect}`
      await bookRetainerInvoice({
        invoiceId: inv.id!,
        prospectId: prospect,
        email: inv.customer_email ?? null,
        amountCents: inv.amount_paid ?? inv.total ?? inv.amount_due ?? 4900,
        firstInvoice,
        livemode: event.livemode,
      })
    }
  }

  return NextResponse.json({ received: true })
}

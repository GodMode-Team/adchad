import { sql } from '../lib/db'
import { fix as realFix } from './fix'
import { send as realSend } from './email'

// Deterministic fulfillment — NO agent brain. Webhook records a paid order; the worker (scripts/fulfill-worker.ts)
// polls and drains here. Revenue is owned by the Stripe webhook; we only book the generation COST.
// Idempotency key = fixes.order_id (unique). The generated creative is persisted BEFORE the email is sent, so a
// failed/retried send never re-runs the paid fix() — retries reuse the stored creative.
type Deps = { fix: typeof realFix; send: typeof realSend }
const DEFAULT: Deps = { fix: realFix, send: realSend }

/** Fulfill one paid order: generate the fix (once), email it, record delivery. Idempotent + spend-safe. */
export async function fulfillOrder(orderId: number | string, deps: Deps = DEFAULT): Promise<'delivered' | 'skipped'> {
  const [o] = await sql<any[]>`select id, prospect_id, buyer_email, status, tier from orders where id=${orderId}`
  if (!o || o.status !== 'paid' || !o.buyer_email || o.tier !== 5) return 'skipped' // auto-fulfill only the $5 single fix ($12/$49 are different products)

  const [prior] = await sql<any[]>`select headline, body, cta, image_url, delivered_at from fixes where order_id=${o.id}`
  if (prior?.delivered_at) return 'skipped' // already delivered

  let r: { imageUrl: string; headline: string; body: string; cta: string; fixed: string[] }
  if (prior?.image_url) {
    // a previous run generated but the send failed — reuse it, do NOT pay for gpt-image-2 again
    r = { imageUrl: prior.image_url, headline: prior.headline, body: prior.body, cta: prior.cta, fixed: [] }
  } else {
    const [ad] = await sql<any[]>`select creative_url from ads where brand_id=${o.prospect_id} and creative_url is not null order by created_at desc limit 1`
    const [roast] = await sql<any[]>`select text from interactions where prospect_id=${o.prospect_id} and channel in ('roast','x') and direction='out' order by created_at desc limit 1`
    const [p] = await sql<any[]>`select name from prospects where id=${o.prospect_id}`
    if (!ad?.creative_url) throw new Error(`fulfill ${o.id}: no ad creative_url for prospect ${o.prospect_id}`)
    r = await deps.fix({ image: ad.creative_url, brand: p?.name || 'your brand', roast: roast?.text ?? null })
    // persist the generation + book the cost ONCE, before sending — so a send retry reuses this and never re-spends
    await sql`insert into fixes (order_id, headline, body, cta, image_url) values (${o.id}, ${r.headline}, ${r.body}, ${r.cta}, ${r.imageUrl})
              on conflict (order_id) do update set headline=excluded.headline, body=excluded.body, cta=excluded.cta, image_url=excluded.image_url`
    await sql`insert into ledger (kind, amount_cents, note) values ('cost', 6, ${'creative fix order ' + o.id + ' (est)'})` // revenue is the webhook's
  }

  const body =
    `Your fixed ad is ready. The creative goes in Meta's image slot; the copy below goes in the native fields (don't paste it onto the image too).\n\n` +
    `HEADLINE\n${r.headline}\n\nPRIMARY TEXT\n${r.body}\n\nCTA\n${r.cta}\n\nREADY-TO-RUN CREATIVE:\n${r.imageUrl}\n\n` +
    (r.fixed.length ? `What I fixed:\n- ${r.fixed.join('\n- ')}\n\n` : '') + `— Chad`
  // ponytail: send THEN mark delivered (next line). A crash in the ~ms window could double-email on retry —
  // acceptable: the generation is already persisted so a retry is free. Recording-before-send risks silent non-delivery (worse).
  await deps.send({ to: o.buyer_email, subject: 'Your fixed ad is ready', body })

  await sql`update fixes set delivered_at=now() where order_id=${o.id}` // first after send → a later hiccup can't re-send
  await sql`insert into interactions (prospect_id, channel, direction, ref, text)
            values (${o.prospect_id}, 'fix', 'out', ${r.imageUrl}, ${r.headline + ' — ' + r.cta})`
  await sql`update prospects set stage='customer' where id=${o.prospect_id}`
  return 'delivered'
}

/** Drain every unfulfilled paid order. Single worker → sequential → no double-send. Returns count delivered. */
export async function fulfillPaidOrders(deps: Deps = DEFAULT): Promise<number> {
  const orders = await sql<any[]>`select o.id from orders o
    where o.status='paid' and o.tier=5 and not exists (select 1 from fixes fx where fx.order_id=o.id and fx.delivered_at is not null)
    order by o.created_at asc`
  let n = 0
  for (const o of orders) {
    try { if ((await fulfillOrder(o.id, deps)) === 'delivered') n++ }
    catch (e) { console.error(`[fulfill] order ${o.id} failed:`, (e as Error).message) }
  }
  return n
}

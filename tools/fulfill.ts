import { sql } from '../lib/db'
import { fix as realFix, type FixResult } from './fix'
import { send as realSend } from './email'
import { xpost as realXpost } from './xpost'
import { bookCost } from './cost'

// Deterministic fulfillment — NO agent brain. Webhook records a paid order; the worker (scripts/fulfill-worker.ts)
// polls and drains here. Delivery is a PUBLIC X reply into the roast thread when one exists (the funny, public proof);
// otherwise email. Revenue is the webhook's; we book only the COST. Idempotency key = fixes.order_id (unique); the
// creative is persisted BEFORE delivery, so a failed/retried delivery reuses it and never re-pays for gpt-image-2.
type Deps = {
  fix: typeof realFix
  send: typeof realSend
  xreply: typeof realXpost
  paused: () => Promise<boolean>
}
const DEFAULT: Deps = {
  fix: realFix,
  send: realSend,
  xreply: realXpost,
  paused: async () => { const [c] = await sql<any[]>`select paused from control where id=1`; return !!c?.paused },
}

/** Fulfill one paid order: generate the fix (once), deliver it (X reply else email), record it. Idempotent + spend-safe. */
export async function fulfillOrder(orderId: number | string, deps: Deps = DEFAULT): Promise<'delivered' | 'skipped'> {
  const [o] = await sql<any[]>`select id, prospect_id, buyer_email, status, tier, livemode from orders where id=${orderId}`
  if (!o || o.status !== 'paid' || (o.tier !== 5 && o.tier !== 12)) return 'skipped' // auto-fulfill the $5 single fix + $12 A/B pack ($49 membership is a different product)
  if (o.livemode === false) return 'skipped' // a test-mode order in the shared DB must never trigger a real fix + public X post from the live worker

  const [prior] = await sql<any[]>`select headline, body, cta, image_url, variants, delivered_at from fixes where order_id=${o.id}`
  if (prior?.delivered_at) return 'skipped' // already delivered

  const [p] = await sql<any[]>`select name, x_handle from prospects where id=${o.prospect_id}`
  // Deliver into the public roast thread when there is one (and the kill-switch is off); else email.
  const [xRow] = await sql<any[]>`select ref from interactions
    where prospect_id=${o.prospect_id} and channel='x' and direction='out' and ref is not null order by created_at desc limit 1`
  const roastTweetId: string | null = xRow?.ref ?? null
  const viaX = !!roastTweetId && !(await deps.paused())
  if (!viaX && !o.buyer_email) throw new Error(`fulfill ${o.id}: no X roast tweet to reply to and no buyer_email — nowhere to deliver`)

  let r: FixResult
  if (prior?.image_url) {
    // a previous run generated but delivery failed — reuse it, do NOT pay for gpt-image-2 again
    const imgs: string[] = prior.variants?.images?.length ? prior.variants.images : [prior.image_url]
    r = { imageUrl: prior.image_url, imageUrls: imgs, headline: prior.headline, body: prior.body, cta: prior.cta, fixed: [], cost: 0 } // cost already booked on first gen
  } else {
    const [ad] = await sql<any[]>`select creative_url from ads where brand_id=${o.prospect_id} and creative_url is not null order by created_at desc limit 1`
    const [roast] = await sql<any[]>`select text from interactions where prospect_id=${o.prospect_id} and channel in ('roast','x') and direction='out' order by created_at desc limit 1`
    if (!ad?.creative_url) throw new Error(`fulfill ${o.id}: no ad creative_url for prospect ${o.prospect_id}`)
    const variants = o.tier === 12 ? 3 : 1 // $12 A/B pack = 3 distinct creatives; $5 = 1
    r = await deps.fix({ image: ad.creative_url, brand: p?.name || 'your brand', roast: roast?.text ?? null, variants })
    // persist the generation + book the cost ONCE, before delivery — so a retry reuses this and never re-spends
    await sql`insert into fixes (order_id, headline, body, cta, image_url, variants)
              values (${o.id}, ${r.headline}, ${r.body}, ${r.cta}, ${r.imageUrls[0]}, ${sql.json({ images: r.imageUrls })})
              on conflict (order_id) do update set headline=excluded.headline, body=excluded.body, cta=excluded.cta, image_url=excluded.image_url, variants=excluded.variants`
    await bookCost(r.cost, `creative fix order ${o.id}`) // real cost: vision + copy + N images (revenue is the webhook's)
  }

  // DELIVER — public X reply into the roast thread, else email. (Persist-before-deliver above keeps retries free.)
  let fixLink: string | null = null // the fix's public X reply URL — surfaced in the feed + embedded on the thank-you page
  if (viaX) {
    const ctaNote = r.cta ? ` Set your Meta CTA button to "${r.cta}".` : ''
    const multi = r.imageUrls.length > 1
    const lead = multi ? `${r.headline} — ${r.imageUrls.length} variants to A/B test.` : r.headline
    const caption = `${lead}${ctaNote} ${multi ? 'your A/B pack' : 'your $5 fix'}, live 👇`
    const posted = await deps.xreply({ text: caption, imageUrls: r.imageUrls, replyToTweetId: roastTweetId!, handle: p?.x_handle ?? null })
    fixLink = posted.url
    console.log(`[fulfill] order ${o.id} → fix replied on X (${r.imageUrls.length} img): ${posted.url}`)
  } else {
    const imgsBlock = r.imageUrls.length > 1
      ? `READY-TO-RUN CREATIVES (A/B test these):\n${r.imageUrls.join('\n')}`
      : `READY-TO-RUN CREATIVE:\n${r.imageUrls[0]}`
    const body =
      `Your fixed ad is ready. The creative goes in Meta's image slot; the copy below goes in the native fields (don't paste it onto the image too).\n\n` +
      `HEADLINE\n${r.headline}\n\nPRIMARY TEXT\n${r.body}\n\nCTA (pick this label in Meta's button dropdown)\n${r.cta}\n\n${imgsBlock}\n\n` +
      (r.fixed.length ? `What I fixed:\n- ${r.fixed.join('\n- ')}\n\n` : '') + `— Chad`
    await deps.send({ to: o.buyer_email, subject: 'Your fixed ad is ready', body })
  }

  await sql`update fixes set delivered_at=now() where order_id=${o.id}` // mark delivered right after → a later hiccup can't re-deliver
  await sql`insert into interactions (prospect_id, channel, direction, ref, link_url, text)
            values (${o.prospect_id}, 'fix', 'out', ${r.imageUrls[0]}, ${fixLink}, ${r.headline + ' — ' + r.cta})` // ref=image (thumbnail), link_url=the X reply
  await sql`update prospects set stage='customer' where id=${o.prospect_id}`
  return 'delivered'
}

/** Drain every unfulfilled paid order. Single worker → sequential → no double-send. Returns count delivered. */
export async function fulfillPaidOrders(deps: Deps = DEFAULT): Promise<number> {
  const orders = await sql<any[]>`select o.id from orders o
    where o.status='paid' and o.tier in (5, 12) and coalesce(o.livemode, true)
      and not exists (select 1 from fixes fx where fx.order_id=o.id and fx.delivered_at is not null)
    order by o.created_at asc`
  let n = 0
  for (const o of orders) {
    try { if ((await fulfillOrder(o.id, deps)) === 'delivered') n++ }
    catch (e) { console.error(`[fulfill] order ${o.id} failed:`, (e as Error).message) }
  }
  return n
}

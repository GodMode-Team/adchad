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

/** The customer-facing email body (pure, testable). One creative for the $5 fix; one per ANGLE for the $12 A/B pack
 *  (each variant has its OWN copy, so each renders its angle + headline/body/cta + creative). */
export function fixEmailBody(r: FixResult): string {
  const fixedBlock = r.fixed?.length ? `What I fixed:\n- ${r.fixed.join('\n- ')}\n\n` : ''
  const vs = r.variants ?? []
  if (vs.length > 1) {
    const blocks = vs.map((v, i) =>
      `── VARIANT ${i + 1} · ${v.angle.toUpperCase()} ANGLE ──\nHEADLINE\n${v.headline}\n\nPRIMARY TEXT\n${v.body}\n\nCTA (Meta button label)\n${v.cta}\n\nMOCKUP (preview)\n${v.imageUrl}\nUPLOADABLE CREATIVE (drop into Meta)\n${v.creativeUrl || v.imageUrl}`,
    ).join('\n\n')
    return `Your A/B pack is ready — ${vs.length} ready-to-run ads, each testing a different angle. Upload each creative into Meta's image slot and put its copy in the native fields (don't paste copy onto the image).\n\n${blocks}\n\n${fixedBlock}— Chad`
  }
  const upload = r.creativeUrls?.[0] || r.imageUrls[0]
  return `Your fixed ad is ready. The image below is the finished mockup; upload the creative into Meta's image slot and put the copy in the native fields.\n\nHEADLINE\n${r.headline}\n\nPRIMARY TEXT\n${r.body}\n\nCTA (pick this label in Meta's button dropdown)\n${r.cta}\n\nMOCKUP (preview)\n${r.imageUrls[0]}\nUPLOADABLE CREATIVE (drop into Meta)\n${upload}\n\n${fixedBlock}— Chad`
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
    const creatives: string[] = prior.variants?.creatives?.length ? prior.variants.creatives : imgs
    r = { imageUrl: prior.image_url, imageUrls: imgs, creativeUrls: creatives, headline: prior.headline, body: prior.body, cta: prior.cta, variants: prior.variants?.variants ?? undefined, fixed: [], cost: 0 } // cost already booked on first gen
  } else {
    const [ad] = await sql<any[]>`select creative_url from ads where brand_id=${o.prospect_id} and creative_url is not null order by created_at desc limit 1`
    const [roast] = await sql<any[]>`select text from interactions where prospect_id=${o.prospect_id} and channel in ('roast','x') and direction='out' order by created_at desc limit 1`
    if (!ad?.creative_url) throw new Error(`fulfill ${o.id}: no ad creative_url for prospect ${o.prospect_id}`)
    const variants = o.tier === 12 ? 3 : 1 // $12 A/B pack = 3 distinct creatives; $5 = 1
    r = await deps.fix({ image: ad.creative_url, brand: p?.name || 'your brand', roast: roast?.text ?? null, variants })
    // persist the generation + book the cost ONCE, before delivery — so a retry reuses this and never re-spends
    await sql`insert into fixes (order_id, headline, body, cta, image_url, variants)
              values (${o.id}, ${r.headline}, ${r.body}, ${r.cta}, ${r.imageUrls[0]}, ${sql.json({ images: r.imageUrls, creatives: r.creativeUrls ?? [], variants: r.variants ?? null })})
              on conflict (order_id) do update set headline=excluded.headline, body=excluded.body, cta=excluded.cta, image_url=excluded.image_url, variants=excluded.variants`
    await bookCost(r.cost, `creative fix order ${o.id}`) // real cost: vision + copy + N images (revenue is the webhook's)
  }

  // DELIVER — public X reply into the roast thread, else email. (Persist-before-deliver above keeps retries free.)
  let fixLink: string | null = null // the fix's public X reply URL — surfaced in the feed + embedded on the thank-you page
  if (viaX) {
    const multi = r.imageUrls.length > 1
    const upload = r.creativeUrls?.length ? r.creativeUrls : r.imageUrls // bare 1080² Meta-ready assets; fall back to mockups
    // LEAD: Chad hands it over with the finished Meta card(s) — visual-first public proof.
    const lead = multi
      ? `here's your ad, unfucked — ${r.imageUrls.length} angles to A/B test. 🔧\nthis is how each looks live. pick your winner — copy + uploadable creatives in the reply 👇`
      : `here's your ad, unfucked. 🔧\nthis is how it looks live. the copy + your ready-to-upload creative are in the reply 👇`
    const leadPost = await deps.xreply({ text: lead, imageUrls: r.imageUrls, replyToTweetId: roastTweetId!, handle: p?.x_handle ?? null })
    fixLink = leadPost.url // thread head — surfaced in the feed + thank-you page
    // SUBTWEET: pasteable components + the BARE uploadable creative(s), threaded under the lead.
    const comps = multi
      ? [`📋 ${r.imageUrls.length} angles — paste each into Meta, attach its creative in order:`, ``,
         ...(r.variants?.length ? r.variants.map((v, i) => `${i + 1}) ${v.angle.toUpperCase()} → ${v.headline}  ·  CTA: ${v.cta}`) : [`📣 ${r.headline}`, `🔘 CTA → ${r.cta}`]),
         ``, `🎨 ${upload.length} uploadable creatives attached — drop into Meta.`].join('\n')
      : [`📣 HEADLINE`, r.headline, ``, `✍️ PRIMARY TEXT`, r.body, ``, `🔘 CTA BUTTON → ${r.cta}`, ``,
         `🎨 CREATIVE attached — drop it straight into Meta, paste the copy into the native fields. done.`].join('\n')
    await deps.xreply({ text: comps, imageUrls: upload, replyToTweetId: leadPost.tweetId, handle: null })
    console.log(`[fulfill] order ${o.id} → fix thread on X (lead + components): ${leadPost.url}`)
  } else {
    const subject = (r.variants?.length ?? 0) > 1 ? 'Your A/B ad pack is ready' : 'Your fixed ad is ready'
    await deps.send({ to: o.buyer_email, subject, body: fixEmailBody(r) })
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

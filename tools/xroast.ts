import { TwitterApi } from 'twitter-api-v2'
import { sql } from '../lib/db'
import { roast, salesLink } from './roast'
import { xpost } from './xpost'
import { bookCost } from './cost'

// Roast an X tweet's ad PUBLICLY: read the tweet's image, roast it, reply in-thread with the roast + the $5
// sales link, and persist the prospect + the roast reply's tweet id — so the paid fix can reply into the thread.
// freeFix defaults to "armed" when the caller doesn't say: while the launch campaign is armed, ANY public roast
// (launch-thread reply, or an autonomous /prospect roast via the bare CLI) gives away the fix for engagement —
// a caller that must never comp (the @adchad-summon path, tools/mention.ts) has to opt out explicitly.
function client() {
  return new TwitterApi({
    appKey: process.env.X_API_KEY!, appSecret: process.env.X_API_SECRET!,
    accessToken: process.env.X_ACCESS_TOKEN!, accessSecret: process.env.X_ACCESS_SECRET!,
  })
}

/** pull the numeric id out of a tweet URL (…/status/<id>) or a bare id. */
export function tweetIdOf(urlOrId: string): string {
  const m = String(urlOrId).match(/status\/(\d+)/)
  return m ? m[1] : String(urlOrId).replace(/\D/g, '')
}

/** explicit always wins; unspecified falls back to whether the launch campaign is armed. */
export function resolveFreeFix(explicit: boolean | undefined, armed: boolean): boolean {
  return explicit ?? armed
}

/** is the launch campaign armed (a tweet is pinned as the launch thread)? Takes the already-fetched control row —
 *  xroast() needs `paused` from the same row anyway, so this avoids a second round-trip for `launch_tweet_id`. */
export function isLaunchArmed(ctrl: { launch_tweet_id?: string | null } | null | undefined): boolean {
  return !!ctrl?.launch_tweet_id
}

/** Comp a tier-5 $0 order (source='launch' — excluded from revenue metrics) so the existing fulfill-worker
 *  delivers the real fix creative. Idempotent under concurrency via a real DB constraint (db/schema.sql's
 *  orders_launch_comp_uniq partial unique index) — a retried/duplicate call for the same prospect never double-comps. */
export async function compFreeFixOrder(prospectId: string): Promise<void> {
  await sql`insert into orders (prospect_id, tier, status, amount, livemode, source)
            values (${prospectId}, 5, 'paid', 0, true, 'launch')
            on conflict (prospect_id) where source='launch' do nothing`
}

export async function xroast(opts: { tweet: string; replyTo?: string; freeFix?: boolean }): Promise<{ prospectId: string; roastTweetId: string; salesUrl: string | null }> {
  const id = tweetIdOf(opts.tweet)
  if (!id) throw new Error('xroast: a tweet URL or id is required')
  // Where the roast reply lands. Defaults to the roasted tweet (launch/manual path); the @adchad-summon path roasts the
  // AD (the mention's own image, or the tweet it replies to) but replies under the MENTION, so it passes replyTo.
  const replyToId = opts.replyTo ? tweetIdOf(opts.replyTo) : id

  // Public post — never roast while the kill-switch is on. Fetch launch_tweet_id in the same round-trip (both live on
  // the single `control` row) — freeFix's armed-check below reuses it instead of querying again.
  const [ctrl] = await sql<any[]>`select paused, launch_tweet_id from control where id=1`
  if (ctrl?.paused) throw new Error('xroast: kill-switch is ON — refusing to post publicly. `db resume` first.')

  const x = client()

  // 1. SEE the ad (the tweet's image) + who posted it
  const t = await x.v2.singleTweet(id, {
    expansions: ['attachments.media_keys', 'author_id'],
    'media.fields': ['url', 'preview_image_url'],
    'user.fields': ['username'],
  })
  const media = (t.includes?.media ?? []).find((m: any) => m.url || m.preview_image_url) as any
  const imageUrl: string | undefined = media?.url || media?.preview_image_url
  if (!imageUrl) throw new Error(`xroast: tweet ${id} has no image to roast`)
  const author: string | null = t.includes?.users?.[0]?.username ?? null

  // Never roast our OWN tweet (e.g. a 3rd party replies @adchad under one of our roast/fix images) — that's a self-roast
  // loop, since our replies carry images. The mention runner catches this and skips (no nudge — there's nothing to fix).
  const me = (process.env.X_HANDLE || 'adchadofficial').toLowerCase()
  if (author && author.toLowerCase() === me) throw new Error(`xroast: refusing to roast our own tweet (${id}) — not an ad`)

  // 2. roast it (vision + Grok). Don't pass ad/prospect ids — we record the score ourselves below.
  const r = await roast({ image: imageUrl, handle: author, brand: author })

  // 3. persist the prospect + ad (PUBLIC — no email_source='inbound', so it shows in the /live feed)
  const slug = (author || 'brand').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'brand'
  const prospectId = `x-${slug}-${id.slice(-8)}`
  const adId = `xad-${id}`
  await sql`insert into ads (id, brand_id, advertiser, creative_url) values (${adId}, ${prospectId}, ${author}, ${imageUrl}) on conflict (id) do nothing`
  await sql`insert into prospects (id, name, x_handle, segment, stage) values (${prospectId}, ${author}, ${author}, ${'public'}, ${'roasted'}) on conflict (id) do nothing`
  await sql`insert into scores (ad_id, prospect_id, total) values (${adId}, ${prospectId}, ${r.score})`
  await bookCost(r.cost, `roast prospect ${prospectId}`) // real P&L: vision + grok cost of this roast

  // 4. reply publicly with the roast. A free-fixed roast (launch-thread reply, or armed-window prospecting) gets
  //    NO paid-funnel link — the free fix is delivered as its own reply right below. @adchad summons are always a
  //    $5 sell (tools/mention.ts passes freeFix:false explicitly) → keep the per-prospect sales page.
  const freeFix = resolveFreeFix(opts.freeFix, isLaunchArmed(ctrl))
  const salesUrl = freeFix ? null : salesLink(prospectId)
  const posted = await xpost({ text: r.xPost, link: salesUrl, replyToTweetId: replyToId })

  // 5. record the roast reply tweet id — the row tools/fulfill.ts reads to reply the fix into the thread
  await sql`insert into interactions (prospect_id, ad_id, channel, direction, ref, text)
            values (${prospectId}, ${adId}, ${'x'}, ${'out'}, ${posted.tweetId}, ${r.xPost})`

  // 6. comp the free fix (after the interactions row above exists, so fulfill.ts can always find the thread)
  if (freeFix) await compFreeFixOrder(prospectId)

  return { prospectId, roastTweetId: posted.tweetId, salesUrl }
}

import { sql } from '../lib/db'
import { scan } from './foreplay'
import { roast, salesLink } from './roast'
import { xpost } from './xpost'
import { resolveFreeFix, isLaunchArmed, compFreeFixOrder, tweetIdOf } from './xroast'
import { bookCost } from './cost'

// Deterministic prospecting — the reliable replacement for the agent /prospect → /roast heartbeat (Nemotron kept
// double-posting, skipping the image, and calling blocked tools). Straight-line code, no agent brain: pick ONE
// un-roasted Foreplay ad → roast it (the roast tool COACHES a genuinely-strong ad, score>=70, instead of savaging
// it — the safety floor for auto-posting) → post EXACTLY ONCE with the ad image → record it → comp a FREE fix while
// the launch campaign is armed, else attach the $5 link. Refills a rotating niche scan when the queue runs dry.
// Wire as a system-cron beat (every 2h) alongside launch/mention. control.paused is the only valve.

export const NICHES = ['med spa', 'dentist', 'hvac', 'gym', 'lawn care', 'roofing', 'chiropractor', 'plumber', 'auto detailing', 'pilates studio']

export type Target = { prospectId: string; brand: string; adId: string; creativeUrl: string }
type RunResult = { reason?: 'paused' | 'no-target'; roasted?: string; tweetId?: string; freeFix?: boolean; niche?: string }

export type ProspectDeps = {
  control: () => Promise<{ paused: boolean; launch_tweet_id: string | null }>
  pick: () => Promise<Target | null>
  scan: (niche: string) => Promise<number>
  countProspects: () => Promise<number>
  roastAndPost: (t: Target, freeFix: boolean, replyTo?: string) => Promise<{ tweetId: string }>
}

/** Rotate through the seed niches by how many prospects we've accumulated — spreads coverage without extra state. */
export function nextNiche(prospectCount: number): string {
  return NICHES[prospectCount % NICHES.length]
}

/** Next un-roasted Foreplay ad with a usable image — long-running advertisers first (real spenders, not one-offs). */
export async function pickTarget(): Promise<Target | null> {
  const [t] = await sql<any[]>`
    select p.id as prospect_id, coalesce(p.name, a.advertiser) as brand, a.id as ad_id, a.creative_url
    from prospects p
    join ads a on a.brand_id = p.id and a.creative_url is not null
    where coalesce(p.stage, 'new') = 'new'
      and coalesce(p.segment, '') <> 'unreachable'
      and not exists (select 1 from interactions i where i.prospect_id = p.id and i.channel = 'x' and i.direction = 'out')
    order by a.running_duration desc nulls last, a.first_seen asc nulls last
    limit 1`
  if (!t) return null
  return { prospectId: t.prospect_id, brand: t.brand ?? 'this business', adId: t.ad_id, creativeUrl: t.creative_url }
}

/** Roast a Foreplay ad's image and post it PUBLICLY as a standalone tweet (the ad isn't an X post, so we attach the
 *  creative), record the roast, and comp the free fix or attach the $5 link. Mirrors xroast's persist→post→record→comp
 *  ordering (the interactions row must exist before the comp so the fulfill-worker can find the roast thread). */
async function roastAndPost(t: Target, freeFix: boolean, replyTo?: string): Promise<{ tweetId: string }> {
  const r = await roast({ image: t.creativeUrl, handle: null, brand: t.brand, adId: t.adId, prospectId: t.prospectId })
  const salesUrl = freeFix ? null : salesLink(t.prospectId)
  // replyTo set (seed path) → the roast lands as a reply IN the launch thread instead of standalone; the bad ad still
  // rides along as the image, and the fulfill-worker nests the free fix under this roast tweet.
  const posted = await xpost({ text: r.xPost, imageUrls: [t.creativeUrl], link: salesUrl, replyToTweetId: replyTo ?? null })
  await sql`insert into scores (ad_id, prospect_id, total) values (${t.adId}, ${t.prospectId}, ${r.score})`
  await sql`update prospects set stage = 'roasted' where id = ${t.prospectId}`
  await sql`insert into interactions (prospect_id, ad_id, channel, direction, ref, text)
            values (${t.prospectId}, ${t.adId}, 'x', 'out', ${posted.tweetId}, ${r.xPost})`
  await bookCost(r.cost, `prospect roast ${t.prospectId}`)
  if (freeFix) await compFreeFixOrder(t.prospectId) // after the interactions row exists → worker can find the thread
  return { tweetId: posted.tweetId }
}

const DEFAULT: ProspectDeps = {
  control: async () => {
    const [c] = await sql<any[]>`select paused, launch_tweet_id from control where id = 1`
    return { paused: !!c?.paused, launch_tweet_id: c?.launch_tweet_id ?? null }
  },
  pick: pickTarget,
  scan: async (niche) => (await scan(niche, 10)).prospects.length,
  countProspects: async () => Number((await sql<any[]>`select count(*)::int as n from prospects`)[0]?.n ?? 0),
  roastAndPost,
}

/** One prospecting beat: roast exactly one un-roasted ad (refilling the queue if dry). Idempotent-ish — a roasted
 *  prospect is filtered out of pickTarget forever, so re-running never double-roasts the same ad.
 *  opts.replyTo → reply the roast into that thread (seed path); opts.forceFreeFix → always comp (ignore arm state). */
export async function run(deps: Partial<ProspectDeps> = {}, opts: { replyTo?: string; forceFreeFix?: boolean } = {}): Promise<RunResult> {
  const d = { ...DEFAULT, ...deps }
  const ctrl = await d.control()
  if (ctrl.paused) return { reason: 'paused' } // kill-switch — the only valve

  let target = await d.pick()
  let niche: string | undefined
  if (!target) {
    // queue dry → scan the next niche in rotation, then re-pick once
    niche = nextNiche(await d.countProspects())
    await d.scan(niche)
    target = await d.pick()
    if (!target) return { reason: 'no-target', niche } // scan returned nothing new — next beat rotates on
  }

  const freeFix = opts.forceFreeFix || resolveFreeFix(undefined, isLaunchArmed(ctrl)) // armed launch window → free fix; else the $5 sell
  const { tweetId } = await d.roastAndPost(target, freeFix, opts.replyTo)
  return { roasted: target.prospectId, tweetId, freeFix, niche }
}

export type SeedResult = { thread: string; requested: number; posted: number; roasted: string[]; results: RunResult[] }

/** One-off launch-thread seeder: run the beat `count` times, replying each roast INTO `thread` (defaults to the armed
 *  launch tweet) and ALWAYS comping the free fix — so the thread fills with roast→fix pairs the fulfill-worker delivers.
 *  Replicable (safe to re-run: pickTarget never re-picks a roasted prospect). Stops early on the kill-switch. */
export async function seed(opts: { count?: number; thread?: string; deps?: Partial<ProspectDeps> } = {}): Promise<SeedResult> {
  const d = { ...DEFAULT, ...(opts.deps ?? {}) }
  const count = opts.count ?? 10
  const threadRaw = opts.thread ?? (await d.control()).launch_tweet_id // the whole point is seeding THAT thread
  if (!threadRaw) throw new Error('prospect seed: pass --thread <url|id>, or arm a launch tweet first (nothing to seed into)')
  const thread = tweetIdOf(threadRaw)
  // Validate the PARSED id, not just the raw arg: tweetIdOf('') a profile url (no /status/) → '' , which xpost treats as
  // falsy and silently drops the reply → roasts would blast the timeline standalone. Refuse instead (mirrors xroast).
  if (!thread) throw new Error(`prospect seed: '${threadRaw}' has no tweet id — pass a /status/<id> url or a bare tweet id`)

  const results: RunResult[] = []
  for (let i = 0; i < count; i++) {
    const r = await run(opts.deps ?? {}, { replyTo: thread, forceFreeFix: true })
    results.push(r)
    if (r.reason === 'paused') break // kill-switch flipped mid-run → stop, report what landed
  }
  const posted = results.filter((r) => r.tweetId)
  return { thread, requested: count, posted: posted.length, roasted: posted.map((r) => r.roasted!), results }
}

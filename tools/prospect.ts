import { sql } from '../lib/db'
import { scan } from './foreplay'
import { roast, salesLink } from './roast'
import { xpost } from './xpost'
import { resolveFreeFix, isLaunchArmed, compFreeFixOrder } from './xroast'
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
  roastAndPost: (t: Target, freeFix: boolean) => Promise<{ tweetId: string }>
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
async function roastAndPost(t: Target, freeFix: boolean): Promise<{ tweetId: string }> {
  const r = await roast({ image: t.creativeUrl, handle: null, brand: t.brand, adId: t.adId, prospectId: t.prospectId })
  const salesUrl = freeFix ? null : salesLink(t.prospectId)
  const posted = await xpost({ text: r.xPost, imageUrls: [t.creativeUrl], link: salesUrl })
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
 *  prospect is filtered out of pickTarget forever, so re-running never double-roasts the same ad. */
export async function run(deps: Partial<ProspectDeps> = {}): Promise<RunResult> {
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

  const freeFix = resolveFreeFix(undefined, isLaunchArmed(ctrl)) // armed launch window → free fix; else the $5 sell
  const { tweetId } = await d.roastAndPost(target, freeFix)
  return { roasted: target.prospectId, tweetId, freeFix, niche }
}

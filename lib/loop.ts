import { sql } from './db'
import { scan } from './foreplay'
import { enrich } from './enrich'
import { score } from './score'
import { roast } from './roast'
import { xpost } from './xpost'
import { outreachEmail } from './email'

export type RunSummary = { runId: number; scanned: number; enriched: number; qualified: number; posted: number; emailed: number; errors: any[] }

async function paused(): Promise<boolean> {
  const [c] = await sql<{ paused: boolean }[]>`select paused from control where id = 1`
  return !!c?.paused
}

/** The autonomous spine: scan → enrich → score(gate≥85) → roast → post + email. `dryRun` skips publish (tests). */
export async function runBatch(n: number, opts: { query?: string; dryRun?: boolean } = {}): Promise<RunSummary> {
  const query = opts.query || 'med spa'
  const errors: any[] = []
  const { ads } = await scan(query, n)
  let enriched = 0, qualified = 0, posted = 0, emailed = 0

  const seen = new Set<string>()
  for (const ad of ads) {
    const pid = ad.brand_id
    if (!pid || seen.has(pid)) continue
    seen.add(pid)
    if (await paused()) break // kill-switch
    try {
      const e = await enrich({ id: pid, name: ad.advertiser, link_url: ad.link_url })
      enriched++
      const prospect = { id: pid, email: e.email, email_source: e.email_source, x_handle: e.x_handle, segment: e.segment }
      const s = await score(
        { id: ad.foreplay_id, advertiser: ad.advertiser, copy: ad.copy, niches: ad.niches, running_duration: ad.running_duration },
        prospect,
      )
      if (s.gate !== 'qualify') continue
      qualified++

      const [sc] = await sql<any[]>`select votes from scores where ad_id = ${ad.foreplay_id} order by id desc limit 1`
      const r = await roast({ name: ad.advertiser }, { advertiser: ad.advertiser, copy: ad.copy, niches: ad.niches }, sc?.votes?.badnessReasons ?? [])
      const buyUrl = `${process.env.APP_URL || 'http://localhost:3000'}/?p=${pid}`

      let postUrl: string | null = null, tweetId: string | null = null
      if (!opts.dryRun) {
        const tw = await xpost({ text: r.text, imageUrl: ad.creative_url, link: buyUrl, handle: e.segment === 'A' ? e.x_handle : null })
        postUrl = tw.url; tweetId = tw.tweetId
        posted++
      }
      await sql`insert into roasts (prospect_id, ad_id, text, hook, model, status, post_url, tweet_id, sent_at)
                values (${pid}, ${ad.foreplay_id}, ${r.text}, ${r.hook}, ${process.env.MODEL_ROAST ?? null},
                        ${opts.dryRun ? 'drafted' : 'posted'}, ${postUrl}, ${tweetId}, ${opts.dryRun ? null : new Date()})`

      if (!opts.dryRun && e.email) {
        try {
          await outreachEmail({ name: ad.advertiser, email: e.email }, r, postUrl ?? '', buyUrl)
          emailed++
          await sql`update roasts set status = 'emailed', emailed_at = now() where ad_id = ${ad.foreplay_id}`
        } catch (err: any) {
          errors.push({ pid, step: 'email', msg: String(err?.message).slice(0, 120) }) // domain not verified → expected for now
        }
      }
    } catch (err: any) {
      errors.push({ pid, msg: String(err?.message).slice(0, 140) })
    }
  }

  const [run] = await sql<{ id: number }[]>`
    insert into runs (scanned, enriched, qualified, posted, emailed, errors)
    values (${ads.length}, ${enriched}, ${qualified}, ${posted}, ${emailed}, ${sql.json(errors)}) returning id`
  return { runId: run.id, scanned: ads.length, enriched, qualified, posted, emailed, errors }
}

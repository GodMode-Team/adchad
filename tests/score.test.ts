import { describe, it, expect, beforeAll } from 'vitest'
import { scan } from '../lib/foreplay'
import { enrich } from '../lib/enrich'
import { score } from '../lib/score'
import { migrate, sql } from '../lib/db'

describe('Spec 03 — score (live, no mocks)', () => {
  let ad: any, prospect: any

  beforeAll(async () => {
    await migrate()
    await scan('med spa', 10)
    const [row] = await sql<any[]>`
      select p.id as pid, a.id as aid, a.advertiser, a.copy, a.niches, a.running_duration, a.link_url
        from prospects p join ads a on a.brand_id = p.id
       where a.copy is not null limit 1`
    const e = await enrich({ id: row.pid, name: row.advertiser, link_url: row.link_url })
    ad = { id: row.aid, advertiser: row.advertiser, copy: row.copy, niches: row.niches, running_duration: row.running_duration }
    prospect = { id: row.pid, email: e.email, email_source: e.email_source, x_handle: e.x_handle, segment: e.segment }
  }, 120_000)

  it('scores three axes, gates, persists, and runs a ≥3-call safety vote', async () => {
    const r = await score(ad, prospect)

    for (const k of ['badness', 'economic', 'reachSafety', 'total'] as const) {
      expect(r[k]).toBeGreaterThanOrEqual(0)
      expect(r[k]).toBeLessThanOrEqual(100)
    }
    expect(['qualify', 'held', 'filter']).toContain(r.gate)
    // total is the weighted blend
    expect(r.total).toBe(Math.round(0.35 * r.badness + 0.3 * r.economic + 0.35 * r.reachSafety))

    const [s] = await sql<any[]>`select votes from scores where ad_id = ${ad.id} order by id desc limit 1`
    expect(Array.isArray(s.votes.safeVotes)).toBe(true)
    expect(s.votes.safeVotes.length).toBeGreaterThanOrEqual(3)
  })
})

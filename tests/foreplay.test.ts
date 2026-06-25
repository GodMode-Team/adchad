import { describe, it, expect, beforeAll } from 'vitest'
import { scan } from '../lib/foreplay'
import { migrate, sql } from '../lib/db'

describe('Spec 01 — foreplay scan (live, no mocks)', () => {
  beforeAll(async () => { await migrate() })

  it('imports real ads from the live API and dedupes advertisers into prospects', async () => {
    const { ads, prospects } = await scan('med spa', 25)

    // real ads came back
    expect(ads.length).toBeGreaterThan(0)
    expect(ads.every((a) => !!a.advertiser)).toBe(true)
    expect(ads.some((a) => !!a.creative_url)).toBe(true)
    expect(ads.some((a) => (a.copy ?? '').length > 0)).toBe(true)
    // link_url (the website) captured for enrichment (Spec 02)
    expect(ads.some((a) => !!a.link_url)).toBe(true)

    // persisted to the real DB
    const [{ count }] = await sql<{ count: number }[]>`select count(*)::int as count from ads`
    expect(count).toBeGreaterThan(0)

    // dedupe holds: every prospect id is unique
    const dupes = await sql`select id from prospects group by id having count(*) > 1`
    expect(dupes.length).toBe(0)
    expect(prospects.length).toBeGreaterThan(0)
  })
})

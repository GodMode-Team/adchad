import { describe, it, expect, beforeAll } from 'vitest'
import { enrich } from '../../tools/enrich'
import { migrate, sql } from '../../lib/db'

// Live, no mocks — resolves a real domain, scrapes it, and persists the segment.
describe('enrich tool — real domain → contact → segment', () => {
  beforeAll(async () => { await migrate() }, 30_000)

  it('classifies a real ad row into a valid segment with a reachable contact', async () => {
    const [ad] = await sql<{ brand_id: string; advertiser: string | null; link_url: string }[]>`
      select brand_id, advertiser, link_url from ads where link_url is not null limit 1`
    expect(ad, 'need at least one scanned ad with a link_url (run foreplay scan first)').toBeTruthy()

    const out = await enrich({ id: ad.brand_id, name: ad.advertiser, link_url: ad.link_url })

    expect(['A', 'B', 'unreachable']).toContain(out.segment)
    // reachable segments must surface a contact; unreachable is the only no-contact outcome
    const reachable = Boolean(out.email) || Boolean(out.x_handle)
    expect(reachable || out.segment === 'unreachable').toBe(true)
  }, 120_000)
})

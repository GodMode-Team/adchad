import { describe, it, expect, beforeAll } from 'vitest'
import { scan } from '../../tools/foreplay'
import { migrate } from '../../lib/db'

// Live, no mocks — hits the real Foreplay discovery API and persists into ads/prospects.
describe('foreplay tool — scan (real ad discovery)', () => {
  beforeAll(async () => { await migrate() }, 30_000)

  it('returns {ads, prospects} with at least one real ad', async () => {
    const out = await scan('med spa', 3)
    expect(out).toHaveProperty('ads')
    expect(out).toHaveProperty('prospects')
    expect(Array.isArray(out.ads)).toBe(true)
    expect(out.ads.length).toBeGreaterThanOrEqual(1)

    // at least one ad carries a real advertiser + creative
    const usable = out.ads.find((a) => a.advertiser && a.creative_url)
    expect(usable, 'expected ≥1 ad with non-empty advertiser and creative_url').toBeTruthy()
    expect(usable!.advertiser!.length).toBeGreaterThan(0)
    expect(usable!.creative_url!.length).toBeGreaterThan(0)
  }, 120_000)
})

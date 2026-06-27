import { describe, it, expect, beforeAll } from 'vitest'
import { describe as visionLook } from '../../tools/vision' // vision's fn is also named `describe` — alias to avoid the vitest collision
import { scan } from '../../tools/foreplay'
import { migrate } from '../../lib/db'

// Live, no mocks — spec-11: every vision pass on an ad must also emit a 0–100 `score` (lower = worse)
// + a one-line `verdict`, grounded ONLY in the visible flaws. We pull a REAL Foreplay ad creative and
// audit it, so the number/verdict are real, not canned. (real_flaws stays an unchanged contract.)
describe('vision tool — creative score (0–100 + verdict)', () => {
  let creativeUrl: string | undefined
  beforeAll(async () => {
    await migrate()
    const { ads } = await scan('med spa', 1)
    creativeUrl = ads.find((a) => a.creative_url)?.creative_url ?? undefined
  }, 120_000)

  it('returns an integer score 0–100 + a non-empty verdict, keeping real_flaws', async (ctx) => {
    if (!creativeUrl) return ctx.skip() // no real ad came back from Foreplay — nothing to score this run

    const look: any = await visionLook(creativeUrl)

    expect(typeof look.score).toBe('number')
    expect(Number.isInteger(look.score)).toBe(true)
    expect(look.score).toBeGreaterThanOrEqual(0)
    expect(look.score).toBeLessThanOrEqual(100)

    expect(typeof look.verdict).toBe('string')
    expect(look.verdict.length).toBeGreaterThan(0)

    expect(Array.isArray(look.real_flaws)).toBe(true) // unchanged: the score is grounded in these
  }, 120_000)
})

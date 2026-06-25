import { describe, it, expect, beforeAll } from 'vitest'
import { scan } from '../lib/foreplay'
import { roast } from '../lib/roast'
import { migrate, sql } from '../lib/db'

describe('Spec 04 (roast generation) — live, no mocks', () => {
  let ad: any
  beforeAll(async () => {
    await migrate()
    await scan('hvac repair', 10)
    ;[ad] = await sql<any[]>`
      select advertiser, copy, niches from ads
       where copy is not null order by length(coalesce(copy,'')) desc limit 1`
  }, 60_000)

  it('produces a non-empty, on-length roast + hook from a real ad', async () => {
    const r = await roast({ name: ad.advertiser }, ad)
    console.log(`\n  ROAST of "${ad.advertiser}": ${r.text}\n  HOOK: ${r.hook}\n`)

    expect(r.text.length).toBeGreaterThan(15)
    expect(r.text.length).toBeLessThanOrEqual(300) // ~tweet length; xpost enforces the hard 280 w/ link
    expect(r.hook.length).toBeGreaterThan(5)
    expect(r.text.toLowerCase()).not.toMatch(/i (can'?t|cannot|won'?t|am unable)/) // not a refusal
  })
})

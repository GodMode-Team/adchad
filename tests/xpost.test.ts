import { describe, it, expect, beforeAll } from 'vitest'
import { scan } from '../lib/foreplay'
import { roast } from '../lib/roast'
import { xpost } from '../lib/xpost'
import { migrate, sql } from '../lib/db'
import { TwitterApi } from 'twitter-api-v2'

// Posts a REAL tweet from @adchadofficial, asserts it, then deletes it (keeps the account clean + saves quota).
describe('Spec 04 (xpost) — live, posts then deletes', () => {
  let r: { text: string; hook: string }
  let ad: any
  beforeAll(async () => {
    await migrate()
    await scan('hvac repair', 8)
    ;[ad] = await sql<any[]>`
      select advertiser, copy, niches, creative_url from ads
       where copy is not null order by length(coalesce(copy, '')) desc limit 1`
    r = await roast({ name: ad.advertiser }, ad)
  }, 60_000)

  it('posts a roast + buy link from @adchadofficial and returns a real tweet id', async () => {
    const buyUrl = `${process.env.APP_URL || 'http://localhost:3000'}/?p=test`
    const res = await xpost({ text: r.text, imageUrl: ad.creative_url, link: buyUrl })

    expect(res.tweetId).toMatch(/^\d+$/)
    expect(res.url).toContain('adchadofficial')
    console.log(`\n  POSTED (then deleting): ${res.url}\n  TEXT: ${r.text}\n`)

    const x = new TwitterApi({
      appKey: process.env.X_API_KEY!, appSecret: process.env.X_API_SECRET!,
      accessToken: process.env.X_ACCESS_TOKEN!, accessSecret: process.env.X_ACCESS_SECRET!,
    })
    const del = await x.v2.deleteTweet(res.tweetId)
    expect(del.data.deleted).toBe(true)
  }, 60_000)
})

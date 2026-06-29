import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { migrate, sql } from '../../lib/db'
import { run } from '../../tools/db'

// Hall of Shame pulls the lowest-scored public roasts AND the original ad they roasted (ad_id is `xad-<tweetId>`);
// Hall of Fame pulls the delivered fix tweets.
describe('db halls — Shame (ad + roast) + Fame (delivered fixes)', () => {
  const pid = 'test-halls-' + Date.now()
  const adTweet = '900000000001' // the "original ad" tweet id; xroast stores ad_id as xad-<id>
  const adId = `xad-${adTweet}`
  beforeAll(async () => {
    await migrate()
    await sql`insert into prospects (id, name, stage) values (${pid}, 'Halls Co', 'roasted') on conflict (id) do nothing`
    await sql`insert into ads (id, brand_id) values (${adId}, ${pid}) on conflict (id) do nothing`
    await sql`insert into scores (ad_id, prospect_id, total) values (${adId}, ${pid}, 1)` // rock bottom → guaranteed in shame
    await sql`insert into interactions (prospect_id, ad_id, channel, direction, ref) values (${pid}, ${adId}, 'x', 'out', 'shame_tweet_1')`
    await sql`insert into interactions (prospect_id, channel, direction, ref, link_url) values (${pid}, 'fix', 'out', 'https://img', 'https://x.com/adchadofficial/status/fame_tweet_1')`
  }, 30_000)
  afterAll(async () => {
    await sql`delete from interactions where prospect_id=${pid}`
    await sql`delete from scores where prospect_id=${pid}`
    await sql`delete from ads where brand_id=${pid}`
    await sql`delete from prospects where id=${pid}`
  })

  it('returns the roast tweet + the original ad tweet in shame, and the fix tweet in fame', async () => {
    const h: any = await run('halls', {})
    expect(Array.isArray(h.shame) && Array.isArray(h.fame)).toBe(true)
    const s = h.shame.find((x: any) => x.tweetId === 'shame_tweet_1')
    expect(s).toBeTruthy()
    expect(s.score).toBe(1)
    expect(s.adTweetId).toBe(adTweet) // original ad recovered from ad_id (xad-<id>)
    expect(h.fame.some((f: any) => f.tweetUrl === 'https://x.com/adchadofficial/status/fame_tweet_1')).toBe(true)
  })
})

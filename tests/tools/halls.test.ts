import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { migrate, sql } from '../../lib/db'
import { run } from '../../tools/db'

// The home page's Hall of Shame pulls the lowest-scored public roast tweets; Hall of Fame pulls delivered fix tweets.
describe('db halls — Shame (worst roasts) + Fame (delivered fixes)', () => {
  const pid = 'test-halls-' + Date.now()
  beforeAll(async () => {
    await migrate()
    await sql`insert into prospects (id, name, stage) values (${pid}, 'Halls Co', 'roasted') on conflict (id) do nothing`
    await sql`insert into ads (id, brand_id) values (${pid + '-ad'}, ${pid}) on conflict (id) do nothing`
    await sql`insert into scores (ad_id, prospect_id, total) values (${pid + '-ad'}, ${pid}, 1)` // rock bottom → guaranteed in shame
    await sql`insert into interactions (prospect_id, ad_id, channel, direction, ref) values (${pid}, ${pid + '-ad'}, 'x', 'out', 'shame_tweet_1')`
    await sql`insert into interactions (prospect_id, channel, direction, ref, link_url) values (${pid}, 'fix', 'out', 'https://img', 'https://x.com/adchadofficial/status/fame_tweet_1')`
  }, 30_000)
  afterAll(async () => {
    await sql`delete from interactions where prospect_id=${pid}`
    await sql`delete from scores where prospect_id=${pid}`
    await sql`delete from ads where brand_id=${pid}`
    await sql`delete from prospects where id=${pid}`
  })

  it('returns the roast tweet in shame (with score) and the fix tweet in fame', async () => {
    const h: any = await run('halls', {})
    expect(Array.isArray(h.shame) && Array.isArray(h.fame)).toBe(true)
    expect(h.shame.some((s: any) => s.tweetId === 'shame_tweet_1' && s.score === 1)).toBe(true)
    expect(h.fame.some((f: any) => f.tweetUrl === 'https://x.com/adchadofficial/status/fame_tweet_1')).toBe(true)
  })
})

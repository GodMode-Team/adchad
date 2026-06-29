import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { migrate, sql } from '../../lib/db'
import { run } from '../../tools/db'

// Hall of Shame = the original ad (ad_id `xad-<id>`) + Chad's roast, as live tweets.
// Hall of Fame = the delivered fix returned as the FULL Meta-ad fields (image + headline + body + cta + business name)
// so the home page can render a real Meta ad CARD (not a bare image), plus the public X reply for "see it live".
describe('db halls — Shame (ad + roast) + Fame (the fix as a Meta-ad card)', () => {
  const pid = 'test-halls-' + Date.now()
  const adTweet = '900000000001' // the "original ad" tweet id; xroast stores ad_id as xad-<id>
  const adId = `xad-${adTweet}`
  let orderId = 0
  beforeAll(async () => {
    await migrate()
    await sql`insert into prospects (id, name, stage) values (${pid}, 'Halls Co', 'customer') on conflict (id) do nothing`
    await sql`insert into ads (id, brand_id) values (${adId}, ${pid}) on conflict (id) do nothing`
    await sql`insert into scores (ad_id, prospect_id, total) values (${adId}, ${pid}, 1)` // rock bottom → guaranteed in shame
    await sql`insert into interactions (prospect_id, ad_id, channel, direction, ref) values (${pid}, ${adId}, 'x', 'out', 'shame_tweet_1')`
    // a delivered fix: order → fixes row (the Meta fields the card renders) → the public X reply (link_url) for "see it live"
    const [o] = await sql<any[]>`insert into orders (prospect_id, tier, status) values (${pid}, 5, 'paid') returning id`
    orderId = Number(o.id)
    await sql`insert into fixes (order_id, headline, body, cta, image_url, delivered_at)
              values (${orderId}, 'Cut Costs 40%', 'Real before/after proof.', 'Get Quote', 'https://img/fix.png', now())`
    await sql`insert into interactions (prospect_id, channel, direction, ref, link_url)
              values (${pid}, 'fix', 'out', 'https://img/fix.png', 'https://x.com/adchadofficial/status/fame_tweet_1')`
  }, 30_000)
  afterAll(async () => {
    await sql`delete from interactions where prospect_id=${pid}`
    await sql`delete from fixes where order_id=${orderId}`
    await sql`delete from orders where prospect_id=${pid}`
    await sql`delete from scores where prospect_id=${pid}`
    await sql`delete from ads where brand_id=${pid}`
    await sql`delete from prospects where id=${pid}`
  })

  it('shame returns roast + original ad tweet; fame returns the fix as full Meta-ad fields', async () => {
    const h: any = await run('halls', {})
    expect(Array.isArray(h.shame) && Array.isArray(h.fame)).toBe(true)
    const s = h.shame.find((x: any) => x.tweetId === 'shame_tweet_1')
    expect(s).toBeTruthy()
    expect(s.score).toBe(1)
    expect(s.adTweetId).toBe(adTweet) // original ad recovered from ad_id (xad-<id>)
    // Fame is now a full Meta-ad card, not just a tweet url
    const f = h.fame.find((x: any) => x.name === 'Halls Co')
    expect(f).toBeTruthy()
    expect(f.headline).toBe('Cut Costs 40%')
    expect(f.body).toBe('Real before/after proof.')
    expect(f.cta).toBe('Get Quote')
    expect(f.image).toBe('https://img/fix.png')
    expect(f.tweetUrl).toBe('https://x.com/adchadofficial/status/fame_tweet_1')
  })
})

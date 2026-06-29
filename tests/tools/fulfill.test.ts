import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { migrate, sql } from '../../lib/db'
import { fulfillOrder } from '../../tools/fulfill'
import { run } from '../../tools/db'

// Live DB, no mocks (house style). fix()/send()/xreply() are injected stubs so the money-path tests neither spend
// on gpt-image-2 nor send a real email/tweet. We drive fulfillOrder(id) directly (not the global drain) so the live
// suite can't accidentally stub-fulfill a real pending order. `paused` is injected so we don't touch the live kill-switch.
async function seed(pid: string, tier = 5, xTweetId?: string) {
  await migrate()
  await sql`insert into prospects (id, name, email, x_handle, stage) values (${pid}, 'Test Co', 'buyer@example.com', 'testco', 'web') on conflict (id) do nothing`
  await sql`insert into ads (id, brand_id, creative_url) values (${pid + '-ad'}, ${pid}, 'https://example.com/orig.png') on conflict (id) do nothing`
  await sql`insert into interactions (prospect_id, channel, direction, text) values (${pid}, 'roast', 'out', 'brutal roast text')`
  if (xTweetId) await sql`insert into interactions (prospect_id, channel, direction, ref, text) values (${pid}, 'x', 'out', ${xTweetId}, 'roast posted on X')`
  const [o] = await sql<any[]>`insert into orders (prospect_id, tier, stripe_id, buyer_email, amount, status)
    values (${pid}, ${tier}, ${'sess_' + pid}, 'buyer@example.com', ${tier * 100}, 'paid') returning id`
  await sql`insert into ledger (kind, amount_cents, note) values ('revenue', ${tier * 100}, ${'order sess_' + pid})` // webhook books revenue
  return o.id as number
}
async function cleanup(pid: string, orderId: number) {
  await sql`delete from fixes where order_id=${orderId}`
  await sql`delete from interactions where prospect_id=${pid}`
  await sql`delete from ledger where note like ${'%' + pid + '%'} or note like ${'%order ' + orderId + '%'}`
  await sql`delete from orders where id=${orderId}`
  await sql`delete from ads where brand_id=${pid}`
  await sql`delete from prospects where id=${pid}`
}
const noX = { xreply: async () => ({ tweetId: 'x', url: 'u' }), paused: async () => false }

describe('fulfill — idempotent delivery (run twice → exactly once)', () => {
  const pid = 'test-fulfill-' + Date.now()
  let orderId: number
  const sendCalls: any[] = []
  const stub: any = {
    fix: async () => ({ imageUrl: 'https://example.com/fixed.png', imageUrls: ['https://example.com/fixed.png'], headline: 'H', body: 'B', cta: 'C', fixed: ['x'], cost: 0.06 }),
    send: async (o: any) => { sendCalls.push(o); return { id: 'stub-' + sendCalls.length } },
    ...noX,
  }
  beforeAll(async () => { orderId = await seed(pid) }, 30_000)
  afterAll(async () => { await cleanup(pid, orderId) })

  it('delivers once, books cost once, leaves revenue untouched', async () => {
    expect(await fulfillOrder(orderId, stub)).toBe('delivered')
    expect(await fulfillOrder(orderId, stub)).toBe('skipped') // second run is a no-op

    expect(sendCalls.length).toBe(1)
    const fx = await sql<any[]>`select * from fixes where order_id=${orderId} and delivered_at is not null`
    expect(fx.length).toBe(1)
    expect(fx[0].image_url).toBe('https://example.com/fixed.png')
    const [pr] = await sql<any[]>`select stage from prospects where id=${pid}`
    expect(pr.stage).toBe('customer')
    const cost = await sql<any[]>`select * from ledger where kind='cost' and note like ${'%order ' + orderId + '%'}`
    expect(cost.length).toBe(1)
    const [rev] = await sql<any[]>`select coalesce(sum(amount_cents),0)::int s from ledger where kind='revenue' and note=${'order sess_' + pid}`
    expect(rev.s).toBe(500) // webhook owns revenue — fulfillment never re-books it
  })
})

describe('fulfill — a failed send does not re-pay for generation', () => {
  const pid = 'test-fulfill-retry-' + Date.now()
  let orderId: number
  let fixCalls = 0
  let okSends = 0
  let failOnce = true
  const stub: any = {
    fix: async () => { fixCalls++; return { imageUrl: 'https://example.com/fixed.png', imageUrls: ['https://example.com/fixed.png'], headline: 'H', body: 'B', cta: 'C', fixed: [], cost: 0.06 } },
    send: async () => { if (failOnce) { failOnce = false; throw new Error('resend down') } okSends++; return { id: 'ok' } },
    ...noX,
  }
  beforeAll(async () => { orderId = await seed(pid) }, 30_000)
  afterAll(async () => { await cleanup(pid, orderId) })

  it('generates once across a failed send + a successful retry', async () => {
    await expect(fulfillOrder(orderId, stub)).rejects.toThrow('resend down') // 1st: gen, send fails → persisted, undelivered
    expect(await fulfillOrder(orderId, stub)).toBe('delivered')             // 2nd: reuse stored gen, send ok

    expect(fixCalls).toBe(1) // the PAID generation ran exactly once, not per-retry
    expect(okSends).toBe(1)
    const cost = await sql<any[]>`select * from ledger where kind='cost' and note like ${'%order ' + orderId + '%'}`
    expect(cost.length).toBe(1) // cost booked once
    const [fx] = await sql<any[]>`select delivered_at from fixes where order_id=${orderId}`
    expect(fx.delivered_at).toBeTruthy()
  })
})

describe('fulfill — only the $5 single fix is auto-fulfilled', () => {
  const pid = 'test-fulfill-49-' + Date.now()
  let orderId: number
  let sendCalled = false
  const stub: any = {
    fix: async () => ({ imageUrl: '', imageUrls: [], headline: '', body: '', cta: '', fixed: [], cost: 0 }),
    send: async () => { sendCalled = true; return { id: 'x' } },
    ...noX,
  }
  beforeAll(async () => { orderId = await seed(pid, 49) }, 30_000) // a $49 subscription order
  afterAll(async () => { await cleanup(pid, orderId) })

  it('skips a $49 subscription order — no fix, no email', async () => {
    expect(await fulfillOrder(orderId, stub)).toBe('skipped')
    expect(sendCalled).toBe(false)
    const fx = await sql<any[]>`select * from fixes where order_id=${orderId}`
    expect(fx.length).toBe(0)
  })
})

describe('fulfill — delivers via a public X reply when there is a roast tweet', () => {
  const pid = 'test-fulfill-x-' + Date.now()
  let orderId: number
  const xreplyCalls: any[] = []
  let sendCalls = 0
  const stub: any = {
    fix: async () => ({ imageUrl: 'https://example.com/fixed.png', imageUrls: ['https://example.com/fixed.png'], headline: 'New Hook', body: 'B', cta: 'See It', fixed: [], cost: 0.06 }),
    send: async () => { sendCalls++; return { id: 'x' } },
    xreply: async (o: any) => { xreplyCalls.push(o); return { tweetId: 'reply99', url: 'https://x.com/adchadofficial/status/reply99' } },
    paused: async () => false,
  }
  beforeAll(async () => { orderId = await seed(pid, 5, 'roast_tweet_123') }, 30_000)
  afterAll(async () => { await cleanup(pid, orderId) })

  it('replies the fix into the roast thread, not email', async () => {
    expect(await fulfillOrder(orderId, stub)).toBe('delivered')
    expect(sendCalls).toBe(0)                                        // no email
    expect(xreplyCalls.length).toBe(1)                               // one public reply
    expect(xreplyCalls[0].replyToTweetId).toBe('roast_tweet_123')    // into the roast thread
    expect(xreplyCalls[0].imageUrls).toEqual(['https://example.com/fixed.png']) // with the new creative
    const [fx] = await sql<any[]>`select delivered_at from fixes where order_id=${orderId}`
    expect(fx.delivered_at).toBeTruthy()
    // the fix tweet URL is stored for the feed link + the thank-you-page embed
    const [fxInt] = await sql<any[]>`select link_url from interactions where prospect_id=${pid} and channel='fix' and direction='out'`
    expect(fxInt.link_url).toBe('https://x.com/adchadofficial/status/reply99')
    expect(await run('fixstatus', { id: pid })).toMatchObject({ delivered: true, tweetUrl: 'https://x.com/adchadofficial/status/reply99' })
  })
})

describe('fulfill — kill-switch on → email fallback, no public post', () => {
  const pid = 'test-fulfill-paused-' + Date.now()
  let orderId: number
  let xreplyCalls = 0
  let sendCalls = 0
  const stub: any = {
    fix: async () => ({ imageUrl: 'https://example.com/fixed.png', imageUrls: ['https://example.com/fixed.png'], headline: 'H', body: 'B', cta: 'C', fixed: [], cost: 0.06 }),
    send: async () => { sendCalls++; return { id: 'x' } },
    xreply: async () => { xreplyCalls++; return { tweetId: 'r', url: 'u' } },
    paused: async () => true,
  }
  beforeAll(async () => { orderId = await seed(pid, 5, 'roast_tweet_456') }, 30_000)
  afterAll(async () => { await cleanup(pid, orderId) })

  it('falls back to email when paused (no public post)', async () => {
    expect(await fulfillOrder(orderId, stub)).toBe('delivered')
    expect(xreplyCalls).toBe(0) // no public post while paused
    expect(sendCalls).toBe(1)   // delivered privately by email instead
  })
})

describe('fulfill — $12 A/B pack generates + delivers 3 variants in one reply', () => {
  const pid = 'test-fulfill-ab-' + Date.now()
  let orderId: number
  let fixVariants = 0
  const xreplyCalls: any[] = []
  const imageUrls = ['https://example.com/v1.png', 'https://example.com/v2.png', 'https://example.com/v3.png']
  const stub: any = {
    fix: async (o: any) => { fixVariants = o.variants; return { imageUrl: imageUrls[0], imageUrls, headline: 'H', body: 'B', cta: 'Call Now', fixed: [], cost: 0.18 } },
    send: async () => ({ id: 'x' }),
    xreply: async (o: any) => { xreplyCalls.push(o); return { tweetId: 'r', url: 'u' } },
    paused: async () => false,
  }
  beforeAll(async () => { orderId = await seed(pid, 12, 'roast_tweet_ab') }, 30_000) // a $12 A/B-pack order
  afterAll(async () => { await cleanup(pid, orderId) })

  it('asks fix for 3 variants, replies all 3 in ONE tweet, books cost once, idempotent', async () => {
    expect(await fulfillOrder(orderId, stub)).toBe('delivered')
    expect(fixVariants).toBe(3)                            // tier 12 → 3 variants
    expect(xreplyCalls.length).toBe(1)                     // a single public reply…
    expect(xreplyCalls[0].imageUrls).toEqual(imageUrls)    // …carrying all 3 creatives
    const [fx] = await sql<any[]>`select image_url, variants, delivered_at from fixes where order_id=${orderId}`
    expect(fx.image_url).toBe(imageUrls[0])                // primary image kept for the /live thumbnail
    expect(fx.variants.images).toEqual(imageUrls)          // all 3 persisted for retry-reuse
    expect(fx.delivered_at).toBeTruthy()
    const cost = await sql<any[]>`select amount_cents from ledger where kind='cost' and note like ${'%order ' + orderId + '%'}`
    expect(cost.length).toBe(1)                            // one cost row…
    expect(cost[0].amount_cents).toBe(18)                  // …= 3 images × 6¢
    expect(await fulfillOrder(orderId, stub)).toBe('skipped') // second run is a no-op
  })
})

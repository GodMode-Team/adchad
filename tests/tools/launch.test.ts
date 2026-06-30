import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { migrate, sql } from '../../lib/db'
import { mapReplies } from '../../tools/xread'
import { run, arm, disarm } from '../../tools/launch'
import { run as dbRun, interactionEvent } from '../../tools/db'

// Live DB, no mocks (house style). The external calls (replies/roast/me) are injected so the orchestration tests
// never post a real tweet, spend on gpt-image-2, or touch the live kill-switch — but every DB effect is real. `control`
// is injected too so a test never flips the shared control row out from under a running campaign. run() does NOT fulfill
// inline (the fulfill-worker drains the comped order, same as a paid order) — so the tests assert the order is comped.

describe('mapReplies — joins author_id → @handle, drops unresolvable authors', () => {
  it('resolves handles from includes.users and drops tweets whose author is missing', () => {
    const tweets = [
      { id: '111', author_id: 'u1', created_at: 't1' },
      { id: '222', author_id: 'u2', created_at: 't2' }, // u2 not in users → dropped (can't verify it isn't us)
    ]
    const users = [{ id: 'u1', username: 'SomeBrand' }]
    expect(mapReplies(tweets, users)).toEqual({ items: [{ id: '111', handle: 'SomeBrand', created_at: 't1' }] })
  })
  it('returns nothing for an empty search', () => {
    expect(mapReplies([], [])).toEqual({ items: [] })
  })
})

// Shared injectable deps for the orchestration tests. Each test overrides what it needs.
const base = (over: any = {}) => ({
  control: async () => ({ paused: false, launchTweetId: 'LAUNCH_TWEET_ID' }),
  me: async () => 'adchadofficial',
  replies: async () => ({ items: [] as any[] }),
  roast: async () => ({ prospectId: 'unused' }),
  ...over,
})

describe('launch.run — happy path: roast → comped $0 order left for the worker, deduped', () => {
  const pid = 'test-launch-' + Date.now()
  const replyId = 'reply-' + Date.now()
  let roastCalls = 0
  afterAll(async () => {
    await sql`delete from fixes where order_id in (select id from orders where prospect_id=${pid})`
    await sql`delete from interactions where prospect_id=${pid} or ref=${replyId}`
    await sql`delete from orders where prospect_id=${pid}`
    await sql`delete from scores where prospect_id=${pid}`
    await sql`delete from ads where brand_id=${pid}`
    await sql`delete from prospects where id=${pid}`
  })

  it('comps a tier-5 $0 source=launch order (undelivered, for the worker) + writes a launch dedup marker', async () => {
    await migrate()
    const deps = base({
      replies: async () => ({ items: [{ id: replyId, handle: 'somebrand', created_at: 'now' }] }),
      // the roast stub stands in for xroast: it persists the prospect + ad (so the order FK holds) and returns the id
      roast: async (rid: string) => {
        roastCalls++
        await sql`insert into prospects (id, name, x_handle, segment, stage) values (${pid}, 'Some Brand', 'somebrand', 'public', 'roasted') on conflict (id) do nothing`
        await sql`insert into ads (id, brand_id, creative_url) values (${pid + '-ad'}, ${pid}, 'https://example.com/orig.png') on conflict (id) do nothing`
        await sql`insert into interactions (prospect_id, channel, direction, ref, text) values (${pid}, 'x', 'out', ${'roast-of-' + rid}, 'roast text')`
        return { prospectId: pid }
      },
    })

    const res = await run(deps)

    expect(roastCalls).toBe(1)
    expect(res.processed).toEqual([replyId])
    const [o] = await sql<any[]>`select id, tier, status, amount, source, livemode from orders where prospect_id=${pid}`
    expect(o).toMatchObject({ tier: 5, status: 'paid', amount: 0, source: 'launch', livemode: true }) // a free comped fix
    const undelivered = await sql<any[]>`select 1 from fixes where order_id=${o.id} and delivered_at is not null`
    expect(undelivered.length).toBe(0)                     // not fulfilled inline — the worker delivers it (one fulfiller)
    const marker = await sql<any[]>`select 1 from interactions where ref=${replyId} and channel='launch'`
    expect(marker.length).toBe(1)                          // dedup marker keyed on the INCOMING reply id, off-feed
  })
})

describe('launch.run — guards: skip our own handle, skip already-processed replies', () => {
  const replyId = 'dup-reply-' + Date.now()
  afterAll(async () => { await sql`delete from interactions where ref=${replyId}` })

  it('skips a reply from our own @handle (never roast our own fix-creative → no infinite loop)', async () => {
    let roastCalls = 0
    const deps = base({
      replies: async () => ({ items: [{ id: 'self-1', handle: 'AdChadOfficial' }] }), // case-insensitive match
      roast: async () => { roastCalls++; return { prospectId: 'x' } },
    })
    const res = await run(deps)
    expect(roastCalls).toBe(0)
    expect(res.processed).toEqual([])
    expect(res.skipped.find((s: any) => s.id === 'self-1')?.reason).toBe('self')
  })

  it('skips a reply that already has a launch dedup marker', async () => {
    await migrate()
    await sql`insert into interactions (channel, direction, ref, text) values ('launch', 'in', ${replyId}, 'already processed')`
    let roastCalls = 0
    const deps = base({
      replies: async () => ({ items: [{ id: replyId, handle: 'somebrand' }] }),
      roast: async () => { roastCalls++; return { prospectId: 'x' } },
    })
    const res = await run(deps)
    expect(roastCalls).toBe(0)
    expect(res.processed).toEqual([])
    expect(res.skipped.find((s: any) => s.id === replyId)?.reason).toBe('dup')
  })

  it('skips a reply already claimed by the MENTION runner (no cross-source double-roast)', async () => {
    await migrate()
    const mref = 'mention-claimed-' + Date.now()
    // The same launch-thread reply tags @adchad, so the mention runner may have claimed it in a prior beat. launch.run
    // must see a 'mention' claim and skip — else the reply gets both a free comp AND a $5 roast.
    await sql`insert into interactions (channel, direction, ref, text) values ('mention', 'in', ${mref}, 'claimed by mention')`
    let roastCalls = 0
    const deps = base({
      replies: async () => ({ items: [{ id: mref, handle: 'somebrand' }] }),
      roast: async () => { roastCalls++; return { prospectId: 'x' } },
    })
    const res = await run(deps)
    expect(roastCalls).toBe(0)
    expect(res.processed).toEqual([])
    expect(res.skipped.find((s: any) => s.id === mref)?.reason).toBe('dup')
    await sql`delete from interactions where ref=${mref}`
  })
})

describe('launch — comped order + dedup marker stay off the public surfaces', () => {
  it('interactionEvent never renders a launch dedup marker into the /live feed', () => {
    // the marker is direction=in; without the channel=launch guard it would render as a "<brand> replied" event
    expect(interactionEvent({ channel: 'launch', direction: 'in', ref: '123', prospect_name: 'Acme', created_at: 't' })).toBeNull()
  })

  it("a source='launch' comped order is excluded from the public paid-orders + revenue count", async () => {
    await migrate()
    const pid = 'test-launch-metrics-' + Date.now()
    await sql`insert into prospects (id, name, segment, stage) values (${pid}, 'Metric Co', 'public', 'roasted')`
    const before = (await dbRun('metrics', {})) as any
    await sql`insert into orders (prospect_id, tier, status, amount, livemode, source) values (${pid}, 5, 'paid', 0, true, 'launch')`
    const after = (await dbRun('metrics', {})) as any
    await sql`delete from orders where prospect_id=${pid}`
    await sql`delete from prospects where id=${pid}`
    expect(after.orders_paid).toBe(before.orders_paid)   // free launch fix must NOT count as a sale
    expect(after.revenue_cents).toBe(before.revenue_cents)
  })
})

describe('launch.run — disarmed / paused do nothing', () => {
  it('returns reason=disarmed and processes nothing when no launch tweet id is set', async () => {
    let roastCalls = 0
    const res = await run(base({ control: async () => ({ paused: false, launchTweetId: null }), roast: async () => { roastCalls++; return { prospectId: 'x' } } }))
    expect(res.reason).toBe('disarmed')
    expect(res.processed).toEqual([])
    expect(roastCalls).toBe(0)
  })
  it('returns reason=paused and processes nothing when the kill-switch is on', async () => {
    let roastCalls = 0
    const res = await run(base({ control: async () => ({ paused: true, launchTweetId: 'LAUNCH' }), roast: async () => { roastCalls++; return { prospectId: 'x' } } }))
    expect(res.reason).toBe('paused')
    expect(res.processed).toEqual([])
    expect(roastCalls).toBe(0)
  })
})

describe('launch.arm/disarm — round-trips control.launch_tweet_id', () => {
  let original: string | null = null
  beforeAll(async () => { await migrate(); const [c] = await sql<any[]>`select launch_tweet_id from control where id=1`; original = c?.launch_tweet_id ?? null })
  afterAll(async () => { await sql`update control set launch_tweet_id=${original} where id=1` })

  it('stores the parsed tweet id from a URL, and clears it on disarm', async () => {
    await arm('https://x.com/adchadofficial/status/2071805835890810934')
    const [armed] = await sql<any[]>`select launch_tweet_id from control where id=1`
    expect(armed.launch_tweet_id).toBe('2071805835890810934')
    await disarm()
    const [off] = await sql<any[]>`select launch_tweet_id from control where id=1`
    expect(off.launch_tweet_id).toBeNull()
  })
})

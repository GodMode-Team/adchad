import { describe, it, expect, afterAll } from 'vitest'
import { migrate, sql } from '../../lib/db'
import { adTweetOf, mapMentions } from '../../tools/xread'
import { run } from '../../tools/mention'
import { interactionEvent } from '../../tools/db'

// Live DB, no mocks (house style). The external calls (mentions/roast/nudge/me) are injected so the orchestration tests
// never post a real tweet or spend — but every DB effect is real. The @adchad-summon path ALWAYS sells the $5 fix: unlike
// launch.run it NEVER comps an order. The pure resolvers (adTweetOf/mapMentions) carry the only new branchy logic.

describe('adTweetOf — which tweet id holds the ad (own media → replied_to/quoted → null)', () => {
  it('returns the mention id when the mention carries its own media (a screenshot of an ad)', () => {
    expect(adTweetOf({ id: 'M1', attachments: { media_keys: ['mk_1'] } })).toBe('M1')
  })
  it('returns the replied_to parent id when the mention has no media (a live X ad they tagged under)', () => {
    expect(adTweetOf({ id: 'M2', referenced_tweets: [{ type: 'replied_to', id: 'P2' }] })).toBe('P2')
  })
  it('returns the quoted tweet id when the mention has no media and only quotes', () => {
    expect(adTweetOf({ id: 'M3', referenced_tweets: [{ type: 'quoted', id: 'Q3' }] })).toBe('Q3')
  })
  it('prefers replied_to over quoted when both are referenced', () => {
    expect(adTweetOf({ id: 'M4', referenced_tweets: [{ type: 'quoted', id: 'Q4' }, { type: 'replied_to', id: 'P4' }] })).toBe('P4')
  })
  it('returns null when there is no media and nothing referenced (nothing to roast → nudge)', () => {
    expect(adTweetOf({ id: 'M5' })).toBeNull()
  })
  it("prefers the mention's own media over a referenced ad (own screenshot wins)", () => {
    expect(adTweetOf({ id: 'M6', attachments: { media_keys: ['mk_6'] }, referenced_tweets: [{ type: 'replied_to', id: 'P6' }] })).toBe('M6')
  })
})

describe('mapMentions — joins author_id → @handle, attaches adTweetId, drops unresolvable authors', () => {
  it('resolves handle + adTweetId from includes.users and drops tweets whose author is missing', () => {
    const tweets = [
      { id: '111', author_id: 'u1', created_at: 't1', text: 'roast this @adchad', attachments: { media_keys: ['m'] } },
      { id: '222', author_id: 'u2', created_at: 't2', text: '@adchad', referenced_tweets: [{ type: 'replied_to', id: 'PARENT' }] }, // u2 unknown → dropped
    ]
    const users = [{ id: 'u1', username: 'SomeBrand' }]
    expect(mapMentions(tweets, users)).toEqual({
      items: [{ id: '111', handle: 'SomeBrand', text: 'roast this @adchad', created_at: 't1', adTweetId: '111' }],
    })
  })
  it('returns nothing for an empty timeline', () => {
    expect(mapMentions([], [])).toEqual({ items: [] })
  })
})

// Shared injectable deps for the orchestration tests. Each test overrides what it needs.
const base = (over: any = {}) => ({
  control: async () => ({ paused: false }),
  me: async () => 'adchadofficial',
  mentions: async () => ({ items: [] as any[] }),
  roast: async () => ({ prospectId: 'unused' }),
  nudge: async () => {},
  ...over,
})

describe('mention.run — happy path: roast the ad, reply to the mention, NO order comped, deduped', () => {
  const pid = 'mention-test-' + Date.now()
  const mentionId = 'mention-' + Date.now()
  afterAll(async () => {
    await sql`delete from interactions where prospect_id=${pid} or ref=${mentionId}`
    await sql`delete from orders where prospect_id=${pid}`
    await sql`delete from scores where prospect_id=${pid}`
    await sql`delete from ads where brand_id=${pid}`
    await sql`delete from prospects where id=${pid}`
  })

  it('roasts {tweet:mentionId, replyTo:mentionId}, writes a mention marker, comps NO order', async () => {
    await migrate()
    let roastCalls = 0, nudgeCalls = 0, roastArgs: any = null
    const deps = base({
      mentions: async () => ({ items: [{ id: mentionId, handle: 'somebrand', text: '@adchad roast this', adTweetId: mentionId }] }),
      // roast stub stands in for xroast: persists the prospect (so any FK would hold) and returns its id
      roast: async (args: any) => {
        roastCalls++; roastArgs = args
        await sql`insert into prospects (id, name, x_handle, segment, stage) values (${pid}, 'Some Brand', 'somebrand', 'public', 'roasted') on conflict (id) do nothing`
        return { prospectId: pid }
      },
      nudge: async () => { nudgeCalls++ },
    })

    const res = await run(deps)

    expect(roastCalls).toBe(1)
    expect(roastArgs).toEqual({ tweet: mentionId, replyTo: mentionId }) // reply where summoned; roast the ad on the mention
    expect(nudgeCalls).toBe(0)
    expect(res.processed).toEqual([mentionId])
    const marker = await sql<any[]>`select 1 from interactions where ref=${mentionId} and channel='mention'`
    expect(marker.length).toBe(1)                                       // dedup marker keyed on the incoming mention id
    const orders = await sql<any[]>`select 1 from orders where prospect_id=${pid}`
    expect(orders.length).toBe(0)                                       // ALWAYS a $5 sell — the mention path never comps
  })
})

describe('mention.run — parent ad: roast the replied-to tweet, reply to the mention', () => {
  const mentionId = 'mention-parent-' + Date.now()
  const parentId = 'parent-' + Date.now()
  afterAll(async () => { await sql`delete from interactions where ref=${mentionId}` })

  it('calls roast with {tweet:parentId, replyTo:mentionId} (the ad lives on the parent, the reply lands on the mention)', async () => {
    await migrate()
    let roastArgs: any = null
    const deps = base({
      mentions: async () => ({ items: [{ id: mentionId, handle: 'fan', adTweetId: parentId }] }),
      roast: async (args: any) => { roastArgs = args; return { prospectId: 'unused' } },
    })
    const res = await run(deps)
    expect(roastArgs).toEqual({ tweet: parentId, replyTo: mentionId })
    expect(res.processed).toEqual([mentionId])
  })
})

describe('mention.run — no ad found: one nudge, no roast', () => {
  const mentionId = 'mention-noad-' + Date.now()
  afterAll(async () => { await sql`delete from interactions where ref=${mentionId}` })

  it('nudges the summoner and does not roast when adTweetId is null', async () => {
    await migrate()
    let roastCalls = 0, nudgeArg: any = null
    const deps = base({
      mentions: async () => ({ items: [{ id: mentionId, handle: 'fan', adTweetId: null }] }),
      roast: async () => { roastCalls++; return { prospectId: 'x' } },
      nudge: async (id: string) => { nudgeArg = id },
    })
    const res = await run(deps)
    expect(roastCalls).toBe(0)
    expect(nudgeArg).toBe(mentionId)
    expect(res.processed).toEqual([mentionId])
    const marker = await sql<any[]>`select 1 from interactions where ref=${mentionId} and channel='mention'`
    expect(marker.length).toBe(1)
  })
})

describe('mention.run — roast throws "no image" (parent had none): falls back to a nudge, not an error', () => {
  const mentionId = 'mention-noimg-' + Date.now()
  afterAll(async () => { await sql`delete from interactions where ref=${mentionId}` })

  it('nudges instead of erroring when roast reports no image', async () => {
    await migrate()
    let nudgeCalls = 0
    const deps = base({
      mentions: async () => ({ items: [{ id: mentionId, handle: 'fan', adTweetId: 'parent-x' }] }),
      roast: async () => { throw new Error('xroast: tweet parent-x has no image to roast') },
      nudge: async () => { nudgeCalls++ },
    })
    const res = await run(deps)
    expect(nudgeCalls).toBe(1)
    expect(res.processed).toEqual([mentionId])
    expect(res.errors).toEqual([])
  })
})

describe('mention.run — guards: skip our own handle, skip already-claimed mentions', () => {
  const dupId = 'mention-dup-' + Date.now()
  afterAll(async () => { await sql`delete from interactions where ref=${dupId}` })

  it('skips a mention from our own @handle (case-insensitive; never roast our own tweet → no loop)', async () => {
    let roastCalls = 0, nudgeCalls = 0
    const deps = base({
      mentions: async () => ({ items: [{ id: 'self-1', handle: 'AdChadOfficial', adTweetId: 'self-1' }] }),
      roast: async () => { roastCalls++; return { prospectId: 'x' } },
      nudge: async () => { nudgeCalls++ },
    })
    const res = await run(deps)
    expect(roastCalls).toBe(0)
    expect(nudgeCalls).toBe(0)
    expect(res.processed).toEqual([])
    expect(res.skipped.find((s: any) => s.id === 'self-1')?.reason).toBe('self')
  })

  it('skips a mention that already has a mention dedup marker', async () => {
    await migrate()
    await sql`insert into interactions (channel, direction, ref, text) values ('mention', 'in', ${dupId}, 'already claimed')`
    let roastCalls = 0
    const deps = base({
      mentions: async () => ({ items: [{ id: dupId, handle: 'somebrand', adTweetId: dupId }] }),
      roast: async () => { roastCalls++; return { prospectId: 'x' } },
    })
    const res = await run(deps)
    expect(roastCalls).toBe(0)
    expect(res.processed).toEqual([])
    expect(res.skipped.find((s: any) => s.id === dupId)?.reason).toBe('dup')
  })
})

describe('mention.run — cross-source dedup: never double-roast a tweet the launch runner already claimed', () => {
  const id = 'mention-xsrc-' + Date.now()
  afterAll(async () => { await sql`delete from interactions where ref=${id}` })

  it('skips a mention whose tweet already carries a LAUNCH dedup marker (free fix stays launch-exclusive; no $5 double-roast)', async () => {
    await migrate()
    // A direct image-reply to the launch tweet auto-tags @adchad → it lands in BOTH conversation_id (launch) and the
    // mentions timeline. launch.run claims it first (engage step 0 before 0.5); mention.run must see that claim and skip.
    await sql`insert into interactions (channel, direction, ref, text) values ('launch', 'in', ${id}, 'claimed by launch')`
    let roastCalls = 0
    const deps = base({
      mentions: async () => ({ items: [{ id, handle: 'somebrand', adTweetId: id }] }),
      roast: async () => { roastCalls++; return { prospectId: 'x' } },
    })
    const res = await run(deps)
    expect(roastCalls).toBe(0)
    expect(res.processed).toEqual([])
    expect(res.skipped.find((s: any) => s.id === id)?.reason).toBe('dup')
  })
})

describe('mention.run — paused does nothing', () => {
  it('returns reason=paused and processes nothing when the kill-switch is on', async () => {
    let roastCalls = 0, nudgeCalls = 0
    const res = await run(base({
      control: async () => ({ paused: true }),
      mentions: async () => ({ items: [{ id: 'x', handle: 'somebrand', adTweetId: 'x' }] }),
      roast: async () => { roastCalls++; return { prospectId: 'x' } },
      nudge: async () => { nudgeCalls++ },
    }))
    expect(res.reason).toBe('paused')
    expect(res.processed).toEqual([])
    expect(roastCalls).toBe(0)
    expect(nudgeCalls).toBe(0)
  })
})

describe('mention — the dedup marker stays off the public /live feed', () => {
  it('interactionEvent never renders a mention dedup marker into an event', () => {
    // direction=in; without a channel=mention guard it would render as a "<brand> replied" event (the launch-marker bug)
    expect(interactionEvent({ channel: 'mention', direction: 'in', ref: '123', prospect_name: 'Acme', created_at: 't' })).toBeNull()
  })
})

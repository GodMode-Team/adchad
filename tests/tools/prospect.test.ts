import { describe, it, expect } from 'vitest'
import { run, seed, nextNiche, NICHES, type Target } from '../../tools/prospect'

// Deterministic prospecting replaces the flaky agent /prospect → /roast heartbeat. run() is driven by injected deps
// (like launch/mention) so the control flow — pick → refill-if-dry → roast-once → free-vs-$5 — is unit-testable
// without hitting Foreplay/Twitter. The API-bound roastAndPost body is verified in manual QA (same as xroast).
const T: Target = { prospectId: 'p1', brand: 'Acme', adId: 'a1', creativeUrl: 'http://img/1.png' }

const base = () => ({
  control: async () => ({ paused: false, launch_tweet_id: null as string | null }),
  pick: async () => T,
  scan: async (_n: string) => 5,
  countProspects: async () => 0,
  roastAndPost: async (_t: Target, _f: boolean) => ({ tweetId: 't1' }),
})

describe('prospect — deterministic roast beat', () => {
  it('nextNiche rotates through the seed list and wraps', () => {
    expect(nextNiche(0)).toBe(NICHES[0])
    expect(nextNiche(1)).toBe(NICHES[1])
    expect(nextNiche(NICHES.length)).toBe(NICHES[0])
  })

  it('paused → posts nothing', async () => {
    let posted = 0
    const r = await run({ ...base(), control: async () => ({ paused: true, launch_tweet_id: null }), roastAndPost: async () => { posted++; return { tweetId: 't' } } })
    expect(r.reason).toBe('paused')
    expect(posted).toBe(0)
  })

  it('happy path → roasts the picked target exactly once', async () => {
    let posted = 0
    const r = await run({ ...base(), roastAndPost: async (t) => { posted++; expect(t.prospectId).toBe('p1'); return { tweetId: 't1' } } })
    expect(posted).toBe(1)
    expect(r.roasted).toBe('p1')
    expect(r.tweetId).toBe('t1')
  })

  it('queue dry → scans the next niche, then re-picks', async () => {
    let scanned = ''
    let n = 0
    const r = await run({ ...base(),
      pick: async () => (n++ === 0 ? null : { ...T, prospectId: 'p2' }),
      scan: async (niche) => { scanned = niche; return 5 },
    })
    expect(scanned).toBe(NICHES[0]) // countProspects=0 → first niche
    expect(r.roasted).toBe('p2')
  })

  it('still dry after a scan → reports no-target, posts nothing', async () => {
    let posted = 0
    const r = await run({ ...base(), pick: async () => null, roastAndPost: async () => { posted++; return { tweetId: 't' } } })
    expect(r.reason).toBe('no-target')
    expect(posted).toBe(0)
  })

  it('free-fix follows launch-armed: armed → free (no link), disarmed → $5', async () => {
    let freeWhenArmed: boolean | undefined
    await run({ ...base(), control: async () => ({ paused: false, launch_tweet_id: '123' }), roastAndPost: async (_t, f) => { freeWhenArmed = f; return { tweetId: 't' } } })
    expect(freeWhenArmed).toBe(true)
    let freeWhenDisarmed: boolean | undefined
    await run({ ...base(), control: async () => ({ paused: false, launch_tweet_id: null }), roastAndPost: async (_t, f) => { freeWhenDisarmed = f; return { tweetId: 't' } } })
    expect(freeWhenDisarmed).toBe(false)
  })
})

// seed() — the one-off launch-thread seeder: run the SAME beat N times, but reply each roast INTO the linked thread and
// ALWAYS comp the free fix (the worker nests it under the roast). Replicable so a downstream failure can be re-run.
describe('prospect seed — reply the roast+fix into a thread', () => {
  const capture = () => {
    const calls: { replyTo?: string; freeFix: boolean; prospectId: string }[] = []
    let n = 0
    const deps = {
      ...base(),
      pick: async () => ({ ...T, prospectId: `p${n++}` }),
      roastAndPost: async (t: Target, freeFix: boolean, replyTo?: string) => { calls.push({ replyTo, freeFix, prospectId: t.prospectId }); return { tweetId: `tw-${t.prospectId}` } },
    }
    return { calls, deps }
  }

  it('posts `count` roasts, each replying to the thread with a FORCED free fix (even when disarmed)', async () => {
    const { calls, deps } = capture() // base() control is disarmed (launch_tweet_id: null)
    const r = await seed({ count: 3, thread: 'https://x.com/adchadofficial/status/2072062934851719214', deps })
    expect(r.posted).toBe(3)
    expect(calls).toHaveLength(3)
    expect(calls.every((c) => c.replyTo === '2072062934851719214')).toBe(true) // URL parsed to bare id, threaded
    expect(calls.every((c) => c.freeFix === true)).toBe(true)                  // forced free — worker delivers the fix
    expect(r.roasted).toEqual(['p0', 'p1', 'p2'])
  })

  it('defaults the thread to the armed launch tweet when --thread is omitted', async () => {
    const { calls, deps } = capture()
    deps.control = async () => ({ paused: false, launch_tweet_id: '999' })
    const r = await seed({ count: 1, deps })
    expect(r.thread).toBe('999')
    expect(calls[0].replyTo).toBe('999')
  })

  it('stops immediately when the kill-switch is on', async () => {
    const { calls, deps } = capture()
    deps.control = async () => ({ paused: true, launch_tweet_id: '999' })
    const r = await seed({ count: 5, thread: '123', deps })
    expect(calls).toHaveLength(0)
    expect(r.posted).toBe(0)
  })

  it('throws when no thread is given and nothing is armed', async () => {
    const { deps } = capture()
    deps.control = async () => ({ paused: false, launch_tweet_id: null })
    await expect(seed({ count: 1, deps })).rejects.toThrow(/thread/)
  })

  it('throws on a thread arg with no parseable tweet id (never falls back to standalone posts)', async () => {
    const { calls, deps } = capture()
    // a PROFILE url (no /status/<id>) parses to '' → must reject, not post 10 standalone timeline roasts
    await expect(seed({ count: 10, thread: 'https://x.com/adchadofficial', deps })).rejects.toThrow(/tweet id/)
    expect(calls).toHaveLength(0)
  })
})

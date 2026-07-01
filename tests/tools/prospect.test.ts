import { describe, it, expect } from 'vitest'
import { run, nextNiche, NICHES, type Target } from '../../tools/prospect'

// Deterministic prospecting replaces the flaky agent /prospect → /roast heartbeat. run() is driven by injected deps
// (like launch/mention) so the control flow — pick → refill-if-dry → roast-once → free-vs-$5 — is unit-testable
// without hitting Foreplay/Twitter. The API-bound roastAndPost body is verified in manual QA (same as xroast).
const T: Target = { prospectId: 'p1', brand: 'Acme', adId: 'a1', creativeUrl: 'http://img/1.png' }

const base = () => ({
  control: async () => ({ paused: false, launch_tweet_id: null }),
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

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { migrate, sql } from '../../lib/db'
import { resolveFreeFix, isLaunchArmed, compFreeFixOrder } from '../../tools/xroast'

// Live DB, no mocks (house style) for the DB-touching pieces. xroast()'s own Twitter-calling body has never
// been unit tested (no seam for the X API) — these tests cover only the new pure/DB-only logic the
// free-fix-while-armed feature adds; the full wiring is covered by manual QA against real X.

describe('resolveFreeFix — explicit always wins; unspecified falls back to armed', () => {
  it('explicit true wins even when not armed', () => expect(resolveFreeFix(true, false)).toBe(true))
  it('explicit false wins even when armed (the mention.ts guarantee)', () => expect(resolveFreeFix(false, true)).toBe(false))
  it('unspecified + armed → free', () => expect(resolveFreeFix(undefined, true)).toBe(true))
  it('unspecified + not armed → paid', () => expect(resolveFreeFix(undefined, false)).toBe(false))
})

describe('isLaunchArmed — reflects the already-fetched control row (pure, no DB call — avoids a second round-trip)', () => {
  it('true when the row carries a launch tweet id', () => expect(isLaunchArmed({ launch_tweet_id: '123' })).toBe(true))
  it('false when cleared (null)', () => expect(isLaunchArmed({ launch_tweet_id: null })).toBe(false))
  it('false when the row itself is missing', () => expect(isLaunchArmed(undefined)).toBe(false))
})

describe('compFreeFixOrder — comps a tier-5 $0 source=launch order, idempotently (backed by orders_launch_comp_uniq, a real DB constraint — not a select-then-insert race)', () => {
  const pid = 'test-xroast-comp-' + Date.now()
  beforeAll(async () => {
    await migrate()
    await sql`insert into prospects (id, name, segment, stage) values (${pid}, 'Comp Test', 'public', 'roasted')`
  })
  afterAll(async () => {
    await sql`delete from orders where prospect_id=${pid}`
    await sql`delete from prospects where id=${pid}`
  })

  it('inserts one comped order, and a second call is a no-op (no double comp)', async () => {
    await compFreeFixOrder(pid)
    await compFreeFixOrder(pid) // retried/duplicate call — must not create a second order
    const rows = await sql<any[]>`select tier, status, amount, source, livemode from orders where prospect_id=${pid}`
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ tier: 5, status: 'paid', amount: 0, source: 'launch', livemode: true })
  })
})

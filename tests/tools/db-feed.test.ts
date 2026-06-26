import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { run } from '../../tools/db'
import { migrate, sql } from '../../lib/db'

// Live, no mocks — the `db feed` op powers the PUBLIC /live timeline (spec-09).
// It UNIONs recent prospects + interactions + ledger into newest-first events.
// The page is public, so the feed must NEVER leak email/PII fields.
const uniq = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
const pid = `test-feed-${uniq}`
const PRIVATE_EMAIL = 'secret@private.test'
const PRIVATE_BODY = `INBOUND-SECRET-BODY-${uniq}` // an inbound email body must never reach the public feed
const ledgerNote = `test-feed-${uniq}`

describe('db tool — feed op (public /live timeline)', () => {
  beforeAll(async () => {
    await migrate()
    // A new target, a roast carrying private columns, and a revenue ledger row.
    await sql`insert into prospects (id, name) values (${pid}, 'Test Feed Co')`
    await sql`insert into interactions (prospect_id, channel, direction, ref, ad_id, from_addr, subject, text)
      values (${pid}, 'x', 'out', '1234567890', null, ${PRIVATE_EMAIL}, 'SECRET', 'SEEDED ROAST')`
    // an INBOUND email whose body is private — must never be emitted (privacy lives in the SQL projection)
    await sql`insert into interactions (prospect_id, channel, direction, text)
      values (${pid}, 'email', 'in', ${PRIVATE_BODY})`
    await sql`insert into ledger (kind, amount_cents, note) values ('revenue', 500, ${ledgerNote})`
    // a revenue row whose note carries a raw Stripe session id — must be stripped from the public feed
    await sql`insert into ledger (kind, amount_cents, note) values ('revenue', 100, ${'order cs_test_' + uniq + 'AAAAAAAAAAAA'})`
  }, 30_000)

  afterAll(async () => {
    await sql`delete from interactions where prospect_id = ${pid}`
    await sql`delete from ledger where note like ${'%' + uniq + '%'}`
    await sql`delete from prospects where id = ${pid}`
  })

  it('returns an events array and a stats object', async () => {
    const out: any = await run('feed', {})
    expect(Array.isArray(out.events)).toBe(true)
    expect(out.stats && typeof out.stats === 'object').toBe(true)
  })

  it('orders events newest-first (ts descending), each with ts/kind/title', async () => {
    const out: any = await run('feed', {})
    expect(out.events.length).toBeGreaterThan(0)
    for (const e of out.events) {
      expect(e).toHaveProperty('ts')
      expect(e).toHaveProperty('kind')
      expect(e).toHaveProperty('title')
    }
    const ts = out.events.map((e: any) => new Date(e.ts).getTime())
    for (let i = 1; i < ts.length; i++) {
      expect(ts[i - 1]).toBeGreaterThanOrEqual(ts[i])
    }
  })

  it('exposes a numeric stats.margin_cents', async () => {
    const out: any = await run('feed', {})
    expect(typeof out.stats.margin_cents).toBe('number')
  })

  it('surfaces the seeded roast text in an event title or detail', async () => {
    const out: any = await run('feed', {})
    const hit = out.events.some((e: any) =>
      String(e.title ?? '').includes('SEEDED ROAST') ||
      String(e.detail ?? '').includes('SEEDED ROAST'))
    expect(hit).toBe(true)
  })

  it('never leaks email/PII fields (the page is PUBLIC)', async () => {
    const out: any = await run('feed', {})
    const blob = JSON.stringify(out.events)
    expect(blob).not.toContain(PRIVATE_EMAIL)
    expect(blob).not.toContain(PRIVATE_BODY) // inbound email body must not leak
    expect(blob).not.toContain('from_addr')
    expect(blob).not.toContain('subject')
    expect(blob).not.toContain('buyer_email')
  })

  it('strips ID-like tokens (e.g. Stripe session ids) from public money lines', async () => {
    const out: any = await run('feed', {})
    expect(JSON.stringify(out.events)).not.toContain('cs_test_')
  })
})

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { migrate, sql } from '../../lib/db'
import { fulfillOrder } from '../../tools/fulfill'

// Live DB, no mocks (house style). fix()/send() are injected stubs so the money-path tests neither spend on
// gpt-image-2 nor send real email. We drive fulfillOrder(id) directly (not the global drain) so the live suite
// can't accidentally stub-fulfill a real pending order.
async function seed(pid: string) {
  await migrate()
  await sql`insert into prospects (id, name, email, stage) values (${pid}, 'Test Co', 'buyer@example.com', 'web') on conflict (id) do nothing`
  await sql`insert into ads (id, brand_id, creative_url) values (${pid + '-ad'}, ${pid}, 'https://example.com/orig.png') on conflict (id) do nothing`
  await sql`insert into interactions (prospect_id, channel, direction, text) values (${pid}, 'roast', 'out', 'brutal roast text')`
  const [o] = await sql<any[]>`insert into orders (prospect_id, tier, stripe_id, buyer_email, amount, status)
    values (${pid}, 5, ${'sess_' + pid}, 'buyer@example.com', 500, 'paid') returning id`
  await sql`insert into ledger (kind, amount_cents, note) values ('revenue', 500, ${'order sess_' + pid})` // webhook books revenue
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

describe('fulfill — idempotent delivery (run twice → exactly once)', () => {
  const pid = 'test-fulfill-' + Date.now()
  let orderId: number
  const sendCalls: any[] = []
  const stub: any = {
    fix: async () => ({ imageUrl: 'https://example.com/fixed.png', headline: 'H', body: 'B', cta: 'C', fixed: ['x'] }),
    send: async (o: any) => { sendCalls.push(o); return { id: 'stub-' + sendCalls.length } },
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
    fix: async () => { fixCalls++; return { imageUrl: 'https://example.com/fixed.png', headline: 'H', body: 'B', cta: 'C', fixed: [] } },
    send: async () => { if (failOnce) { failOnce = false; throw new Error('resend down') } okSends++; return { id: 'ok' } },
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

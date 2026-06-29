import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { migrate, sql } from '../../lib/db'
import { hireChad, bookRetainerInvoice, saveOnboarding } from '../../tools/retainer'

// The $49/mo retainer. Local runs in Stripe TEST mode (sk_test) → isLive()=false, so "same mode" = stripe_livemode=false.
// Stripe ids are mode-scoped: a customer/sub saved under the OTHER mode must be ignored (→ hosted Checkout fallback).
describe('retainer — hireChad (one-click off-session) + bookRetainerInvoice + onboarding', () => {
  const pid = 'test-retainer-' + Date.now()
  const INVS = ['in_test_1', 'in_renew'] // the fixed Stripe invoice ids this test books — clean ledger by their exact notes (ledger has no prospect_id)
  const noteOf = INVS.map((i) => 'retainer ' + i)
  const clean = async () => {
    await sql`delete from orders where prospect_id=${pid} or stripe_id = any(${INVS})`
    await sql`delete from ledger where note = any(${noteOf})`
    await sql`delete from interactions where prospect_id=${pid}`
    await sql`delete from onboarding where prospect_id=${pid}`
  }
  beforeAll(async () => {
    await migrate()
    await clean() // clear any artifacts left by a prior run (these invoice ids are reused)
    await sql`insert into prospects (id, name) values (${pid}, 'Retainer Co') on conflict (id) do nothing`
  }, 30_000)
  afterEach(async () => {
    await sql`update prospects set stripe_customer=null, stripe_sub=null, stripe_livemode=null, stage='new' where id=${pid}`
    await clean()
  })
  afterAll(async () => {
    await clean()
    await sql`delete from prospects where id=${pid}`
  })

  const okSub = { createSub: async () => ({ subId: 'sub_test_1' }), checkout49: async () => ({ url: 'https://checkout/49' }) }

  it('no saved customer → hosted Checkout fallback', async () => {
    const r = await hireChad(pid, okSub)
    expect(r).toEqual({ status: 'fallback', url: 'https://checkout/49' })
  })

  it('saved same-mode customer + sub created → subscribed, persists stripe_sub + stage=member', async () => {
    await sql`update prospects set stripe_customer='cus_test_1', stripe_livemode=false where id=${pid}`
    const r = await hireChad(pid, okSub)
    expect(r).toEqual({ status: 'subscribed' })
    const [p] = await sql<any[]>`select stripe_sub, stage from prospects where id=${pid}`
    expect(p.stripe_sub).toBe('sub_test_1')
    expect(p.stage).toBe('member')
  })

  it('createSub fails (SCA / declined) → hosted Checkout fallback, no sub persisted', async () => {
    await sql`update prospects set stripe_customer='cus_test_1', stripe_livemode=false where id=${pid}`
    const r = await hireChad(pid, { createSub: async () => { throw new Error('requires_action') }, checkout49: async () => ({ url: 'https://checkout/49' }) })
    expect(r).toEqual({ status: 'fallback', url: 'https://checkout/49' })
    const [p] = await sql<any[]>`select stripe_sub from prospects where id=${pid}`
    expect(p.stripe_sub).toBeNull()
  })

  it('already subscribed (same mode) → already, never re-charges', async () => {
    await sql`update prospects set stripe_customer='cus_test_1', stripe_sub='sub_existing', stripe_livemode=false where id=${pid}`
    let called = false
    const r = await hireChad(pid, { createSub: async () => { called = true; return { subId: 'x' } }, checkout49: async () => ({ url: 'u' }) })
    expect(r).toEqual({ status: 'already' })
    expect(called).toBe(false)
  })

  it('cross-mode saved customer is ignored → fallback (test key must not touch a live customer)', async () => {
    // a live-mode customer/sub on the row while running in test mode: must NOT be reused, and must NOT count as "already"
    await sql`update prospects set stripe_customer='cus_live_x', stripe_sub='sub_live_x', stripe_livemode=true where id=${pid}`
    let called = false
    const r = await hireChad(pid, { createSub: async () => { called = true; return { subId: 'x' } }, checkout49: async () => ({ url: 'https://checkout/49' }) })
    expect(r).toEqual({ status: 'fallback', url: 'https://checkout/49' })
    expect(called).toBe(false)
  })

  it('bookRetainerInvoice: books order+revenue+feed once, emails on first invoice, idempotent', async () => {
    const sent: any[] = []
    const deps = { send: async (m: any) => { sent.push(m); return { id: 'e1' } } }
    const inv = { invoiceId: 'in_test_1', prospectId: pid, email: 'owner@co.com', amountCents: 4900, firstInvoice: true, livemode: true }
    expect(await bookRetainerInvoice(inv, deps)).toBe('booked')
    expect(await bookRetainerInvoice(inv, deps)).toBe('skipped') // idempotent on invoice id
    const orders = await sql<any[]>`select tier, amount, status, livemode from orders where stripe_id='in_test_1'`
    expect(orders.length).toBe(1)
    expect(orders[0]).toMatchObject({ tier: 49, amount: 4900, status: 'paid', livemode: true })
    const rev = await sql<any[]>`select count(*)::int n from ledger where kind='revenue' and note='retainer in_test_1'`
    expect(rev[0].n).toBe(1)
    const hired = await sql<any[]>`select count(*)::int n from interactions where prospect_id=${pid} and channel='retainer'`
    expect(hired[0].n).toBe(1)
    expect(sent.length).toBe(1) // emailed once (first invoice)
    expect(sent[0].to).toBe('owner@co.com')
    expect(sent[0].body).toContain(`/onboard/${pid}`)
  })

  it('bookRetainerInvoice: renewal (not first) does not email; test-mode money stays off the public feed', async () => {
    const sent: any[] = []
    const deps = { send: async (m: any) => { sent.push(m); return { id: 'e1' } } }
    await bookRetainerInvoice({ invoiceId: 'in_renew', prospectId: pid, email: 'owner@co.com', amountCents: 4900, firstInvoice: false, livemode: false }, deps)
    expect(sent.length).toBe(0) // renewal → no confirmation email
    const hired = await sql<any[]>`select count(*)::int n from interactions where prospect_id=${pid} and channel='retainer'`
    expect(hired[0].n).toBe(0) // livemode=false → never on the public feed
    const [o] = await sql<any[]>`select livemode from orders where stripe_id='in_renew'`
    expect(o.livemode).toBe(false)
  })

  it('saveOnboarding: stores answers + starts the 1-week clock', async () => {
    const r = await saveOnboarding(pid, { business: 'Plumbing', offer: '24/7 emergency' })
    expect(r.ok).toBe(true)
    expect(typeof r.reportBy).toBe('string')
    const [row] = await sql<any[]>`select answers from onboarding where prospect_id=${pid} order by submitted_at desc limit 1`
    expect(row.answers.business).toBe('Plumbing')
  })
})

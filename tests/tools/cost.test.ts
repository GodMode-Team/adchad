import { describe, it, expect } from 'vitest'
import { costUsdOf, bookCost } from '../../tools/cost'
import { sql } from '../../lib/db'

// Real costs replace the old flat "(est)" — captured from OpenRouter's usage.cost (USD) and booked to the ledger.
describe('cost — real OpenRouter cost capture + ledger booking', () => {
  it('reads usage.cost (USD); 0 when absent or malformed', () => {
    expect(costUsdOf({ usage: { cost: 0.0123 } })).toBe(0.0123)
    expect(costUsdOf({ usage: { prompt_tokens: 5 } })).toBe(0) // include:true not set → no cost
    expect(costUsdOf({})).toBe(0)
    expect(costUsdOf(null)).toBe(0)
  })

  it('books a real USD cost to the ledger, rounded to whole cents', async () => {
    const note = 'test-cost-' + Date.now()
    const cents = await bookCost(0.184, note)
    expect(cents).toBe(18)
    const [r] = await sql<any[]>`select amount_cents, kind from ledger where note=${note}`
    expect(r.kind).toBe('cost')
    expect(Number(r.amount_cents)).toBe(18)
    await sql`delete from ledger where note=${note}`
  })

  it('does not write a row for a sub-half-cent aggregate (rounds to 0)', async () => {
    const note = 'test-cost-zero-' + Date.now()
    expect(await bookCost(0.004, note)).toBe(0)
    const rows = await sql<any[]>`select 1 from ledger where note=${note}`
    expect(rows.length).toBe(0)
  })
})

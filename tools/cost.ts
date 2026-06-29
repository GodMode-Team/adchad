import { sql } from '../lib/db'

// Real P&L: every model call's actual USD cost comes back from OpenRouter when the request sets usage:{include:true}
// (response.usage.cost). We capture it per call, aggregate per phase, and book ONE rounded-cents ledger row per phase
// — so sub-cent calls (vision, a short grok completion) aren't lost to per-call rounding.

/** The real USD cost of an OpenRouter response (0 when usage.cost is absent — e.g. usage:{include:true} not set). */
export function costUsdOf(json: any): number {
  const c = Number(json?.usage?.cost)
  return Number.isFinite(c) && c > 0 ? c : 0
}

/** Book a real tool cost (USD → whole cents) to the P&L ledger. `note` carries attribution (prospect/order id). */
export async function bookCost(usd: number, note: string): Promise<number> {
  const cents = Math.max(0, Math.round((usd || 0) * 100))
  if (cents > 0) await sql`insert into ledger (kind, amount_cents, note) values ('cost', ${cents}, ${note})`
  return cents
}

import { sql } from '../lib/db'
import { fulfillPaidOrders } from '../tools/fulfill'

// Deterministic fulfillment — no agent brain. Polls for paid orders the Stripe webhook recorded but that
// aren't delivered yet, then fix() → email() → record. Single process (systemd) → sequential → no double-send.
//
// ponytail: a 30s poll, NOT LISTEN/NOTIFY. The DB sits behind Neon's transaction pooler, which doesn't deliver
// notifies; a direct-connection listen would also pin Neon's compute awake (cost). 30s + ~60s generation is well
// inside the "~2 min" promise. If sub-second delivery ever matters, add a direct (unpooled) Neon URL and sql.listen on it.
let draining = false
async function drain() {
  if (draining) return // a slow generation outran the tick; the next tick will catch the rest
  draining = true
  try {
    const n = await fulfillPaidOrders()
    if (n) console.log(`[fulfill] delivered ${n} order(s)`)
  } catch (e) {
    console.error('[fulfill] drain error:', (e as Error).message)
  } finally {
    draining = false
  }
}

async function main() {
  await drain() // sweep on startup
  setInterval(() => void drain(), 30_000)
  console.log('[fulfill] polling paid orders every 30s')
}

main().catch((e) => { console.error('[fulfill] fatal:', e); process.exit(1) })

for (const sig of ['SIGTERM', 'SIGINT'] as const)
  process.on(sig, () => { sql.end({ timeout: 5 }).finally(() => process.exit(0)) })

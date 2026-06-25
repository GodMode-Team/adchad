import { describe, it, expect, beforeAll } from 'vitest'
import { runBatch } from '../lib/loop'
import { migrate, sql } from '../lib/db'

describe('Spec 07 — autonomous loop (live orchestration, no mocks)', () => {
  beforeAll(async () => { await migrate() }, 30_000)

  it('runs scan→enrich→score→roast end-to-end and logs a run (dryRun: no real posts)', async () => {
    await sql`update control set paused = false where id = 1`
    const r = await runBatch(5, { query: 'med spa', dryRun: true })

    expect(r.scanned).toBeGreaterThan(0)
    expect(r.enriched).toBeLessThanOrEqual(r.scanned)
    expect(r.qualified).toBeLessThanOrEqual(r.enriched)
    const [run] = await sql`select * from runs where id = ${r.runId}`
    expect(run).toBeTruthy()
    console.log(`\n  RUN: scanned ${r.scanned} · enriched ${r.enriched} · qualified ${r.qualified} · errors ${r.errors.length}\n`)
  }, 240_000)

  it('kill-switch halts the loop (zero posts/emails when paused)', async () => {
    await sql`update control set paused = true where id = 1`
    const r = await runBatch(4, { query: 'med spa', dryRun: false })
    expect(r.posted).toBe(0)
    expect(r.emailed).toBe(0)
    await sql`update control set paused = false where id = 1`
  }, 30_000)
})

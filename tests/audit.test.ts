import { describe, it, expect, beforeAll } from 'vitest'
import { scan } from '../lib/foreplay'
import { auditData, setPaused } from '../lib/audit'
import { migrate, sql } from '../lib/db'

describe('Spec 06 — audit data + kill-switch (live, no mocks)', () => {
  beforeAll(async () => { await migrate(); await scan('med spa', 5) }, 60_000)

  it('metrics match the DB and the kill-switch toggles', async () => {
    const d = await auditData()
    const [{ c }] = await sql<{ c: number }[]>`select count(*)::int as c from ads`
    expect(d.metrics.scanned).toBe(c)
    expect(d.metrics.scanned).toBeGreaterThan(0)
    expect(Array.isArray(d.roasts)).toBe(true)

    await setPaused(true)
    expect((await auditData()).paused).toBe(true)
    await setPaused(false)
    expect((await auditData()).paused).toBe(false)
  })
})

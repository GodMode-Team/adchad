import { describe, it, expect, beforeAll } from 'vitest'
import { run } from '../../tools/db'
import { migrate, sql } from '../../lib/db'

// Live, no mocks — the `db page` op feeds the /p/<id> sales page (Phase 2 / spec-08).
describe('db tool — page op (sales-page payload)', () => {
  beforeAll(async () => { await migrate() }, 30_000)

  it('returns {found:true, name, ad, roast_text} for an existing prospect', async () => {
    const [p] = await sql<{ id: string }[]>`select id from prospects limit 1`
    expect(p).toBeTruthy() // need at least one scanned prospect
    const out: any = await run('page', { id: p.id })
    expect(out.found).toBe(true)
    expect(out).toHaveProperty('name')
    expect(out).toHaveProperty('ad')        // {creative_url, copy, advertiser} or null
    expect(out).toHaveProperty('roast_text') // string or null
  })

  it('returns {found:false} for an unknown prospect id', async () => {
    const out: any = await run('page', { id: 'definitely-not-a-real-id' })
    expect(out.found).toBe(false)
  })
})

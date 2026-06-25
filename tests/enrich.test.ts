import { describe, it, expect, beforeAll } from 'vitest'
import { scan } from '../lib/foreplay'
import { enrich } from '../lib/enrich'
import { migrate, sql } from '../lib/db'

describe('Spec 02 — enrich (live, no mocks)', () => {
  beforeAll(async () => { await migrate(); await scan('med spa', 20) })

  it('resolves a website and decides a segment from a real ad link', async () => {
    const rows = await sql<{ id: string; name: string; link_url: string }[]>`
      select p.id, p.name, a.link_url
        from prospects p join ads a on a.brand_id = p.id
       where a.link_url ilike 'https://%'
         and a.link_url not ilike '%fb.me%' and a.link_url not ilike '%facebook.com%'
       limit 1`
    expect(rows.length).toBeGreaterThan(0)

    const r = await enrich({ id: rows[0].id, name: rows[0].name, link_url: rows[0].link_url })

    expect(['A', 'B', 'unreachable']).toContain(r.segment)
    expect(r.website).toBeTruthy() // fetched + resolved a real site
    if (r.segment !== 'unreachable') expect(r.email || r.x_handle).toBeTruthy()
    if (r.x_handle) expect(r.website).toBeTruthy() // handle only ever comes from the site

    const [p] = await sql`select segment from prospects where id = ${rows[0].id}`
    expect(p.segment).toBe(r.segment)
  })
})

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { run } from '../../tools/db'
import { migrate, sql } from '../../lib/db'

// The `intake` op persists a full on-demand web roast (ad + prospect + roast + score) in one call,
// so /p/<id> works for someone who uploaded their own ad (a PRIVATE roast — channel='roast', not 'x').
const uniq = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
const pid = `web-${uniq}`
const adId = `webad-${uniq}`

describe('db tool — intake op (on-demand web roast)', () => {
  beforeAll(async () => { await migrate() }, 30_000)
  afterAll(async () => {
    await sql`delete from scores where prospect_id = ${pid}`
    await sql`delete from interactions where prospect_id = ${pid}`
    await sql`delete from ads where id = ${adId}`
    await sql`delete from prospects where id = ${pid}`
  })

  it('creates ad+prospect+roast+score and /p surfaces them', async () => {
    await run('intake', { json: JSON.stringify({ prospect_id: pid, ad_id: adId, name: 'Web Co', email: 'x@y.com', creative_url: 'https://example.com/a.png', roast: 'this ad is lazy garbage', score: 19 }) })
    const page: any = await run('page', { id: pid })
    expect(page.found).toBe(true)
    expect(page.ad?.creative_url).toBe('https://example.com/a.png')
    expect(String(page.roast_text)).toContain('lazy garbage')
    expect(page.score).toBe(19)
  })
})

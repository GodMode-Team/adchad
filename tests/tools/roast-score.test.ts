import { describe as vitestDescribe, it, expect, beforeAll, afterAll } from 'vitest'
import { roast } from '../../tools/roast'
import { sql, migrate } from '../../lib/db'
import type { AdLook } from '../../tools/vision'

// The agent's /prospect→/roast path MUST persist the creative score, or the public Live feed shows none.
// Passing a precomputed `look` skips vision (Grok still writes the roast text); the score (42) must land in `scores`.
const uniq = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
const adId = `rs-ad-${uniq}`
const pid = `rs-${uniq}`
const LOOK: AdLook = { headline: 'x', body: null, offer: null, cta: null, social_proof: null, visual: null, real_flaws: ['generic'], is_video: false, score: 42, verdict: 'weak' }

vitestDescribe('roast tool — persists the creative score on the agent path', () => {
  beforeAll(async () => {
    await migrate()
    await sql`insert into ads (id) values (${adId}) on conflict (id) do nothing`
    await sql`insert into prospects (id, name) values (${pid}, 'RS Co') on conflict (id) do nothing`
  }, 30_000)
  afterAll(async () => {
    await sql`delete from scores where ad_id = ${adId}`
    await sql`delete from ads where id = ${adId}`
    await sql`delete from prospects where id = ${pid}`
  })

  it('writes a scores row (from the vision look) when given ad-id + prospect-id', async () => {
    const r = await roast({ image: 'https://example.com/x.png', look: LOOK, adId, prospectId: pid })
    expect(r.score).toBe(42)
    const [row] = await sql<{ total: string }[]>`select total from scores where ad_id = ${adId} order by created_at desc limit 1`
    expect(row).toBeTruthy()
    expect(Number(row.total)).toBe(42)
  })
})

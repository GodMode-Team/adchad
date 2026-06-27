import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { run } from '../../tools/db'
import { migrate, sql } from '../../lib/db'

// Live, no mocks — spec-11: the 0–100 creative score is persisted to the existing `scores` table and
// surfaced through `db page` (Funnel) and `db feed` (Live) so every roast carries a real number.
const uniq = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
const adId = `test-score-${uniq}`
const pid = `test-score-${uniq}`
const roastText = `SCORE ROAST ${uniq}` // anchors the feed event's detail; uniq also lands in the prospect name → event title

describe('db tool — score op (persist) + page/feed surfacing', () => {
  beforeAll(async () => {
    await migrate()
    // FK order: ads + prospects before the interaction that references them. (score row is inserted in Test A.)
    await sql`insert into ads (id, advertiser, creative_url) values (${adId}, ${'Test Score Co'}, ${'https://example.com/score.jpg'})`
    await sql`insert into prospects (id, name) values (${pid}, ${pid})` // name = id so the feed title `Roasted <name>` carries the uniq marker
    await sql`insert into interactions (prospect_id, ad_id, channel, direction, text)
      values (${pid}, ${adId}, 'x', 'out', ${roastText})`
  }, 30_000)

  afterAll(async () => {
    await sql`delete from scores where ad_id = ${adId} or prospect_id = ${pid}`
    await sql`delete from interactions where prospect_id = ${pid}`
    await sql`delete from ads where id = ${adId}`
    await sql`delete from prospects where id = ${pid}`
  })

  // A — the `score` op records a row in the existing scores table (these run in source order: A writes, B/C read).
  it('records a score to the scores table via run(\'score\', ...)', async () => {
    await run('score', { ad_id: adId, prospect_id: pid, total: 23 })
    const [row] = await sql<{ total: string }[]>`select total from scores where ad_id = ${adId}`
    expect(row).toBeTruthy()
    expect(Number(row.total)).toBe(23)
  })

  // B — `db page` surfaces that numeric score (the 23 just recorded) for the Funnel.
  it('db page --id <prospect> includes the numeric score', async () => {
    const out: any = await run('page', { id: pid })
    expect(out.found).toBe(true)
    expect(typeof out.score).toBe('number')
    expect(out.score).toBe(23)
  })

  // C — `db feed` attaches the numeric score to the roast event for that ad (the Live timeline).
  it('db feed roast event carries the numeric score', async () => {
    const out: any = await run('feed', {})
    const roastEvent = out.events.find((e: any) =>
      e.kind === 'roast' &&
      (String(e.title ?? '').includes(uniq) || String(e.detail ?? '').includes(uniq)))
    expect(roastEvent, 'seeded roast event should be present in the feed').toBeTruthy()
    expect(typeof roastEvent.score).toBe('number')
    expect(roastEvent.score).toBe(23)
  })
})

import { describe, it, expect, beforeAll } from 'vitest'
import { GET } from '../app/api/feed/route' // does not exist yet → import fails → RED
import { migrate } from '../lib/db'

// The public /live page fetches this route every 5s; it returns the feed payload.
describe('GET /api/feed', () => {
  beforeAll(async () => { await migrate() }, 30_000)

  it('returns 200 JSON with events[] and a stats object', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.events)).toBe(true)
    expect(body.stats && typeof body.stats === 'object').toBe(true)
    expect(res.headers.get('Cache-Control')).toContain('no-store') // never cache the public feed response
  })
})

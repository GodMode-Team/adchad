import { NextResponse } from 'next/server'
import { run } from '../../../tools/db'

export const dynamic = 'force-dynamic'

// Public + uncached + multi-query, hit every 5s per viewer. Micro-cache collapses concurrent callers
// into ≤1 DB hit per ~2.5s (no-store still tells the browser/CDN not to cache the response).
let cache: { at: number; body: unknown } | null = null

// Public activity feed for /live — no params; returns { events, stats }. PII is stripped in the db `feed` op.
export async function GET() {
  try {
    const now = Date.now()
    if (!cache || now - cache.at > 2500) cache = { at: now, body: await run('feed', {}) }
    return NextResponse.json(cache.body, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    console.error('feed error', e) // log server-side; don't echo internals to anonymous callers
    return NextResponse.json({ events: [], stats: {} }, { headers: { 'Cache-Control': 'no-store' } })
  }
}

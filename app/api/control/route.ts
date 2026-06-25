import { NextRequest, NextResponse } from 'next/server'
import { setPaused } from '../../../lib/audit'

export async function POST(req: NextRequest) {
  let paused = false
  const ct = req.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    paused = !!(await req.json()).paused
  } else {
    paused = (await req.formData()).get('paused') === 'true'
  }
  await setPaused(paused)
  // POST → redirect back to the dashboard (303 so the browser GETs it)
  return NextResponse.redirect(new URL('/audit', req.url), 303)
}

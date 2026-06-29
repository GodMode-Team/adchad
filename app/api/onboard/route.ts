import { NextRequest, NextResponse } from 'next/server'
import { saveOnboarding } from '../../../tools/retainer'
import { verifyBuyer, buyerCookieName } from '../../../lib/buyer'
import { hit } from '../../../lib/ratelimit'

export const dynamic = 'force-dynamic'

const ipOf = (req: NextRequest) => req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'local'

// Intake form submit → store answers, start the 1-week clock. POST { p, answers }
// AUTH: same proof-of-purchase cookie as the upsell — these answers feed Chad's work, so they can't be attacker-set.
export async function POST(req: NextRequest) {
  const { p, answers } = await req.json().catch(() => ({}))
  if (!p || typeof answers !== 'object' || answers === null || Array.isArray(answers)) return NextResponse.json({ error: 'missing p or answers' }, { status: 400 })
  if (!verifyBuyer(String(p), req.cookies.get(buyerCookieName())?.value)) return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  if (JSON.stringify(answers).length > 16_000) return NextResponse.json({ error: 'answers too long' }, { status: 413 }) // bound jsonb size
  if (!hit(`onboard:${p}`, 8, 3_600_000) || !hit(`onboard:ip:${ipOf(req)}`, 30, 3_600_000)) return NextResponse.json({ error: 'slow down' }, { status: 429 })
  try {
    return NextResponse.json(await saveOnboarding(String(p), answers))
  } catch (e) {
    console.error('onboard error', e)
    return NextResponse.json({ error: 'something went wrong' }, { status: 500 })
  }
}

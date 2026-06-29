import { NextRequest, NextResponse } from 'next/server'
import { hireChad } from '../../../tools/retainer'
import { verifyBuyer, buyerCookieName } from '../../../lib/buyer'
import { hit } from '../../../lib/ratelimit'

export const dynamic = 'force-dynamic'

const ipOf = (req: NextRequest) => req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'local'

// One-click $49/mo retainer from the thank-you page. POST /api/upsell?p=<prospectId>
//   → { status:'subscribed' | 'already' } | { status:'fallback', url } (hosted Checkout)
// AUTH: requires the proof-of-purchase cookie for THIS prospect — the public /p/<id> link must NOT trigger a charge.
export async function POST(req: NextRequest) {
  const p = req.nextUrl.searchParams.get('p') || ''
  if (!p) return NextResponse.json({ error: 'missing prospect' }, { status: 400 })
  if (!verifyBuyer(p, req.cookies.get(buyerCookieName())?.value)) return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  if (!hit(`upsell:${p}`, 4, 3_600_000) || !hit(`upsell:ip:${ipOf(req)}`, 20, 3_600_000)) return NextResponse.json({ error: 'slow down' }, { status: 429 })
  try {
    return NextResponse.json(await hireChad(p))
  } catch (e) {
    console.error('upsell error', e)
    return NextResponse.json({ error: 'something went wrong' }, { status: 500 })
  }
}

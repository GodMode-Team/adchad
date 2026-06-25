import { NextRequest, NextResponse } from 'next/server'
import { checkout } from '../../../tools/stripe'

export const dynamic = 'force-dynamic'

// Landing CTA → real Stripe Checkout. /api/checkout?tier=5&p=<prospectId>
export async function GET(req: NextRequest) {
  const tier = Number(req.nextUrl.searchParams.get('tier') || 5)
  const p = req.nextUrl.searchParams.get('p') || ''
  try {
    const { url } = await checkout({ prospect: p, tier })
    return NextResponse.redirect(url, 303)
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message).slice(0, 200) }, { status: 500 })
  }
}

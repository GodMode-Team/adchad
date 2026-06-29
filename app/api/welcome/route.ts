import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { buyerCookieName, buyerCookieValue } from '../../../lib/buyer'

export const dynamic = 'force-dynamic'

// Stripe success_url lands here. We verify the checkout session is really PAID and for THIS prospect, then set an
// httpOnly proof-of-purchase cookie so the one-click upsell + intake form can authorize. The public /p/<id> link
// alone can't mint this — only a genuine completed checkout (whose session id is known solely to the buyer) can.
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams.get('p') || ''
  const cs = req.nextUrl.searchParams.get('cs') || ''
  const hired = req.nextUrl.searchParams.get('hired') === '1'
  const res = NextResponse.redirect(new URL(`/p/${encodeURIComponent(p)}?paid=1${hired ? '&hired=1' : ''}`, req.url), 303)
  if (p && cs) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      const s = await stripe.checkout.sessions.retrieve(cs)
      const paid = s.payment_status === 'paid' || s.status === 'complete'
      if (paid && s.metadata?.prospect === p) {
        res.cookies.set(buyerCookieName(), buyerCookieValue(p), {
          httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7,
        })
      }
    } catch { /* couldn't verify → no cookie; the upsell will require a real checkout */ }
  }
  return res
}

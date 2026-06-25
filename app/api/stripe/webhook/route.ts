import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { sql } from '../../../../lib/db'

export const dynamic = 'force-dynamic'

// On a paid checkout: record the order + revenue, and queue a fulfill task for the agent.
export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature') || ''
  const body = await req.text() // raw body required for signature verification
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (e: any) {
    return NextResponse.json({ error: `signature: ${e?.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object as Stripe.Checkout.Session
    const prospect = s.metadata?.prospect || null
    const tier = Number(s.metadata?.tier || 5)
    const amount = s.amount_total ?? tier * 100
    await sql`insert into orders (prospect_id, tier, stripe_id, buyer_email, amount, status)
              values (${prospect}, ${tier}, ${s.id}, ${s.customer_details?.email ?? null}, ${amount}, 'paid')`
    await sql`insert into ledger (kind, amount_cents, note) values ('revenue', ${amount}, ${'order ' + s.id})`
    await sql`insert into interactions (prospect_id, channel, direction, ref, text)
              values (${prospect}, 'note', 'in', ${s.id}, ${`PAID tier ${tier} — fulfill me`})`
  }
  return NextResponse.json({ received: true })
}

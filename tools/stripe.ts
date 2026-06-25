import Stripe from 'stripe'

const TIERS: Record<number, { cents: number; name: string; recurring: boolean }> = {
  5: { cents: 500, name: 'AdChad — single ad fix', recurring: false },
  12: { cents: 1200, name: 'AdChad — 3-variant pack', recurring: false },
  49: { cents: 4900, name: 'AdChad — membership', recurring: true },
}

/** Create a real Stripe Checkout session for a tier; metadata carries the prospect so the webhook can fulfill. */
export async function checkout(o: { prospect: string; tier: number }): Promise<{ url: string; id: string }> {
  const t = TIERS[o.tier] ?? TIERS[5]
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const base = process.env.APP_URL || 'http://localhost:3000'
  const s = await stripe.checkout.sessions.create({
    mode: t.recurring ? 'subscription' : 'payment',
    line_items: [{
      price_data: {
        currency: 'usd', product_data: { name: t.name }, unit_amount: t.cents,
        ...(t.recurring ? { recurring: { interval: 'month' as const } } : {}),
      },
      quantity: 1,
    }],
    metadata: { prospect: o.prospect, tier: String(o.tier) },
    success_url: `${base}/?paid=1`,
    cancel_url: `${base}/?p=${encodeURIComponent(o.prospect)}`,
  })
  return { url: s.url!, id: s.id }
}

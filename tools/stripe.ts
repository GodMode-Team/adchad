import Stripe from 'stripe'

const TIERS: Record<number, { cents: number; name: string; recurring: boolean }> = {
  5: { cents: 500, name: 'AdChad — single ad fix', recurring: false },
  12: { cents: 1200, name: 'AdChad — 3-variant pack', recurring: false },
  49: { cents: 4900, name: 'AdChad — membership', recurring: true },
}

/** Create a real Stripe Checkout session for a tier; metadata carries the prospect so the webhook can fulfill. */
export async function checkout(o: { prospect: string; tier: number; customer?: string | null }): Promise<{ url: string; id: string }> {
  const t = TIERS[o.tier] ?? TIERS[5]
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const base = process.env.APP_URL || 'http://localhost:3000'
  // $49/mo uses the reusable retainer Price; one-time tiers use an inline price.
  const line_item = t.recurring && process.env.STRIPE_PRICE_RETAINER
    ? { price: process.env.STRIPE_PRICE_RETAINER, quantity: 1 }
    : { price_data: { currency: 'usd', product_data: { name: t.name }, unit_amount: t.cents, ...(t.recurring ? { recurring: { interval: 'month' as const } } : {}) }, quantity: 1 }
  const s = await stripe.checkout.sessions.create({
    mode: t.recurring ? 'subscription' : 'payment',
    line_items: [line_item],
    ...(o.customer ? { customer: o.customer } : {}), // reuse a saved customer (tier-49 hosted fallback)
    // one-time $5/$12: create a Customer + SAVE the card off-session, so the $49/mo upsell can charge with no re-entry
    ...(!t.recurring && !o.customer ? { customer_creation: 'always' as const, payment_intent_data: { setup_future_usage: 'off_session' as const } } : {}),
    // subscriptions: stamp the prospect on the sub so the invoice.paid webhook can resolve it
    ...(t.recurring ? { subscription_data: { metadata: { prospect: o.prospect } } } : {}),
    metadata: { prospect: o.prospect, tier: String(o.tier) },
    // land on /api/welcome (not /p directly) so the paid session can be verified → sets the proof-of-purchase cookie.
    // {CHECKOUT_SESSION_ID} is a Stripe template Stripe fills in on redirect.
    success_url: `${base}/api/welcome?p=${encodeURIComponent(o.prospect)}&cs={CHECKOUT_SESSION_ID}${t.recurring ? '&hired=1' : ''}`,
    cancel_url: `${base}/p/${encodeURIComponent(o.prospect)}`,
  })
  return { url: s.url!, id: s.id }
}

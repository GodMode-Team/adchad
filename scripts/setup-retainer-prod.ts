import { config } from 'dotenv'
config({ path: '.env.prod' })
import Stripe from 'stripe'

// LIVE prod setup for the retainer. Idempotent. Prints the live Price id to put in Vercel env (STRIPE_PRICE_RETAINER).
//   1. mint a live $49/mo Price (lookup_key 'retainer_monthly_49')
//   2. add invoice.paid + invoice.payment_succeeded to the live webhook (it currently only sends checkout.session.completed)
const LOOKUP = 'retainer_monthly_49'
const NEEDED = ['checkout.session.completed', 'invoice.paid', 'invoice.payment_succeeded']
;(async () => {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key?.startsWith('sk_live')) throw new Error('not a live key — aborting prod setup')
  const stripe = new Stripe(key)

  // 1. price
  const existing = await stripe.prices.list({ lookup_keys: [LOOKUP], active: true, limit: 1 })
  let priceId = existing.data[0]?.id
  if (priceId) console.log('LIVE price (existing):', priceId)
  else {
    const product = await stripe.products.create({ name: 'AdChad — Chad on retainer' })
    const price = await stripe.prices.create({ product: product.id, currency: 'usd', unit_amount: 4900, recurring: { interval: 'month' }, lookup_key: LOOKUP })
    priceId = price.id
    console.log('LIVE price (created):', priceId)
  }

  // 2. webhook events
  const whs = await stripe.webhookEndpoints.list({ limit: 10 })
  for (const w of whs.data) {
    if (!/adchad\.ai\/api\/stripe\/webhook/.test(w.url)) continue
    const have = new Set(w.enabled_events)
    const merged = Array.from(new Set([...w.enabled_events, ...NEEDED]))
    if (NEEDED.every((e) => have.has(e))) { console.log('webhook already has the events:', w.url); continue }
    await stripe.webhookEndpoints.update(w.id, { enabled_events: merged as any })
    console.log('webhook updated:', w.url, '→', merged.join(', '))
  }

  console.log('\n>>> set in Vercel prod env:  STRIPE_PRICE_RETAINER=' + priceId)
  process.exit(0)
})().catch((e) => { console.error(e.message); process.exit(1) })

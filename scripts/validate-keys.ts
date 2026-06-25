import { config } from 'dotenv'
config({ path: '.env.local' })
import OpenAI from 'openai'

// Live-validate the pasted keys (catches placeholders / wrong values). Read-only.
;(async () => {
  try {
    const c = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY, baseURL: 'https://openrouter.ai/api/v1' })
    const r = await c.chat.completions.create({
      model: process.env.MODEL_ROAST!,
      messages: [{ role: 'user', content: 'Reply with exactly one word: pong' }],
      max_tokens: 10,
    })
    console.log(`OpenRouter ✅ ${process.env.MODEL_ROAST} → ${JSON.stringify(r.choices[0]?.message?.content?.trim())}`)
  } catch (e: any) { console.log('OpenRouter ❌', e?.status ?? '', String(e?.message).slice(0, 140)) }

  try {
    const { TwitterApi } = await import('twitter-api-v2')
    const x = new TwitterApi({
      appKey: process.env.X_API_KEY!, appSecret: process.env.X_API_SECRET!,
      accessToken: process.env.X_ACCESS_TOKEN!, accessSecret: process.env.X_ACCESS_SECRET!,
    })
    const me = await x.v2.me()
    console.log(`X ✅ posts as @${me.data.username} (${me.data.name})`)
  } catch (e: any) { console.log('X ❌', e?.code ?? '', e?.data?.detail ?? String(e?.message).slice(0, 140)) }

  try {
    const { Resend } = await import('resend')
    const res = await new Resend(process.env.RESEND_API_KEY).domains.list()
    console.log((res as any).error ? `Resend ❌ ${(res as any).error.message}` : 'Resend ✅')
  } catch (e: any) { console.log('Resend ❌', String(e?.message).slice(0, 140)) }

  try {
    const Stripe = (await import('stripe')).default
    const b = await new Stripe(process.env.STRIPE_SECRET_KEY!).balance.retrieve()
    console.log(`Stripe ✅ (livemode=${b.livemode})`)
  } catch (e: any) { console.log('Stripe ❌', String(e?.message).slice(0, 140)) }
})()

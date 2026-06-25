import { config } from 'dotenv'
config({ path: '.env.local' })

// Presence-check every key AdChad uses, then run a few cheap liveness probes. Read-only — never prints secret values.

const KEYS = [
  'FOREPLAY_API_KEY',
  'DATABASE_URL',
  'OPENROUTER_API_KEY',
  'X_API_KEY', 'X_API_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_SECRET',
  'RESEND_API_KEY', 'RESEND_FROM',
  'BRAVE_API_KEY',
  'STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET',
  'APP_URL',
] as const

const has = (k: string) => !!process.env[k]?.trim()

function printTable() {
  const w = Math.max(...KEYS.map((k) => k.length))
  for (const k of KEYS) console.log(`  ${k.padEnd(w)}  ${has(k) ? 'SET' : 'MISSING'}`)
  const missing = KEYS.filter((k) => !has(k))
  console.log(`\n  ${KEYS.length - missing.length}/${KEYS.length} set${missing.length ? ` — missing: ${missing.join(', ')}` : ' — all present'}`)
}

;(async () => {
  console.log('Keys (.env.local):')
  printTable()

  console.log('\nLiveness:')

  if (has('OPENROUTER_API_KEY')) {
    try {
      const OpenAI = (await import('openai')).default
      const c = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY, baseURL: 'https://openrouter.ai/api/v1' })
      const model = process.env.MODEL_BRAIN || 'nvidia/nemotron-3-super-120b-a12b'
      const r = await c.chat.completions.create({
        model,
        messages: [{ role: 'user', content: 'Reply with exactly one word: pong' }],
        max_tokens: 10,
      })
      console.log(`  OpenRouter  OK   ${model} -> ${JSON.stringify(r.choices[0]?.message?.content?.trim())}`)
    } catch (e: any) { console.log('  OpenRouter  FAIL', e?.status ?? '', String(e?.message).slice(0, 140)) }
  } else console.log('  OpenRouter  skipped (OPENROUTER_API_KEY missing)')

  if (has('X_API_KEY') && has('X_ACCESS_TOKEN')) {
    try {
      const { TwitterApi } = await import('twitter-api-v2')
      const x = new TwitterApi({
        appKey: process.env.X_API_KEY!, appSecret: process.env.X_API_SECRET!,
        accessToken: process.env.X_ACCESS_TOKEN!, accessSecret: process.env.X_ACCESS_SECRET!,
      })
      const me = await x.v2.me()
      console.log(`  X           OK   posts as @${me.data.username} (${me.data.name})`)
    } catch (e: any) { console.log('  X           FAIL', e?.code ?? '', e?.data?.detail ?? String(e?.message).slice(0, 140)) }
  } else console.log('  X           skipped (X_API_KEY / X_ACCESS_TOKEN missing)')

  if (has('RESEND_API_KEY')) {
    try {
      const { Resend } = await import('resend')
      const res: any = await new Resend(process.env.RESEND_API_KEY).domains.list()
      console.log(res?.error ? `  Resend      FAIL ${res.error.message}` : '  Resend      OK')
    } catch (e: any) { console.log('  Resend      FAIL', String(e?.message).slice(0, 140)) }
  } else console.log('  Resend      skipped (RESEND_API_KEY missing)')

  if (has('STRIPE_SECRET_KEY')) {
    try {
      const Stripe = (await import('stripe')).default
      const b = await new Stripe(process.env.STRIPE_SECRET_KEY!).balance.retrieve()
      console.log(`  Stripe      OK   (livemode=${b.livemode})`)
    } catch (e: any) { console.log('  Stripe      FAIL', String(e?.message).slice(0, 140)) }
  } else console.log('  Stripe      skipped (STRIPE_SECRET_KEY missing)')
})()

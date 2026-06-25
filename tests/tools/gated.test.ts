import { describe, it, expect } from 'vitest'
import { checkout } from '../../tools/stripe'
import { generate } from '../../tools/creative'
import { xpost } from '../../tools/xpost'
import { send } from '../../tools/email'

// Key/credit/publish-gated tools. SKIP by default — these spend money or post for real.
// Each test only runs when its explicit env gate is present; otherwise the name shows why it skipped.
describe('gated tools — only run with explicit opt-in', () => {
  it.skipIf(!process.env.STRIPE_SECRET_KEY)(
    'stripe checkout → real test session url (skipped: STRIPE_SECRET_KEY unset)',
    async () => {
      const out = await checkout({ prospect: 'test-prospect', tier: 5 })
      expect(out.url.startsWith('https://')).toBe(true)
      expect(out.id).toMatch(/^cs_/)
    },
    120_000,
  )

  it.skipIf(!process.env.ALLOW_LIVE_CREATIVE)(
    'creative generate → real ad image (skipped: needs ALLOW_LIVE_CREATIVE + OpenRouter credits)',
    async () => {
      const out = await generate({ headline: 'Your ad is mid. We fixed it.' })
      expect(out.imageUrl).toMatch(/^\/fixes\/.+\.png$/)
    },
    120_000,
  )

  it.skipIf(!process.env.ALLOW_LIVE_PUBLISH)(
    'xpost → posts a real tweet (skipped: needs ALLOW_LIVE_PUBLISH — this publishes)',
    async () => {
      const out = await xpost({ text: 'AdChad live test ' + Date.now() })
      expect(out.url).toContain('x.com')
    },
    120_000,
  )

  it.skipIf(!process.env.ALLOW_LIVE_PUBLISH)(
    'email send → sends a real email (skipped: needs ALLOW_LIVE_PUBLISH — this sends)',
    async () => {
      const out = await send({ to: 'delivered@resend.dev', subject: 'AdChad live test', body: 'hi' })
      expect(out.id).toBeTruthy()
    },
    120_000,
  )
})

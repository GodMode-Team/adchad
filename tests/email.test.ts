import { describe, it, expect } from 'vitest'
import { outreachEmail } from '../lib/email'

// No verified domain yet → Resend only delivers to the account owner's own inbox. Set TEST_EMAIL to that address.
describe('Spec 04 (outreach email) — live Resend, no mocks', () => {
  it('sends a real value-first outreach email and returns a message id', async () => {
    const to = process.env.TEST_EMAIL || 'accounts@patientautopilot.com'
    const r = await outreachEmail(
      { name: 'CoolAir HVAC', email: to },
      { text: 'Your ad is a 7-scroll essay with zero hook. Roofing owners do not have time for your novel. Pure slop.', hook: 'Cut to the offer in line one — we will show you how.' },
      'https://x.com/adchadofficial/status/2070241437980000555',
      'http://localhost:3000/?p=demo',
    )
    expect(r.id).toBeTruthy()
    console.log(`\n  SENT outreach → ${to} (Resend id ${r.id})\n`)
  }, 30_000)
})

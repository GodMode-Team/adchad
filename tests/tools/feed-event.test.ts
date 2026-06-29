import { describe, it, expect } from 'vitest'
import { interactionEvent } from '../../tools/db'

// The webhook writes a channel='note', direction='in' "PAID" marker. The feed used to render ANY inbound as
// "<who> replied" — so payment showed as "replied" ~immediately, ~90s before the fix actually posts. It must
// instead read as a "generating…" working state, with the real fix delivery as its own later event.
const base = { created_at: '2026-06-29T19:35:12.000Z', prospect_name: 'acme' }

describe('feed — interaction → event mapping', () => {
  it('maps the webhook PAID note to a "generating" state, never "replied"', () => {
    const e = interactionEvent({ ...base, channel: 'note', direction: 'in', text: 'PAID tier 12 — fulfill me' })
    expect(e.kind).toBe('paid')
    expect(e.title).toMatch(/generating/i)
    expect(e.title).not.toMatch(/replied/i)
  })

  it('still maps a genuine inbound reply (X/email) to "replied"', () => {
    expect(interactionEvent({ ...base, channel: 'x', direction: 'in' }).title).toMatch(/replied/i)
  })

  it('maps a delivered fix — keeps the image thumbnail AND links the tweet', () => {
    const e = interactionEvent({ ...base, channel: 'fix', direction: 'out', ref: 'https://blob/x.png', link_url: 'https://x.com/adchadofficial/status/2071679272071073812' })
    expect(e.kind).toBe('fix')
    expect(e.image).toBe('https://blob/x.png')
    expect(e.link).toBe('https://x.com/adchadofficial/status/2071679272071073812')
  })

  it('maps a public X roast', () => {
    const e = interactionEvent({ ...base, channel: 'x', direction: 'out', ref: '123', text: 'savage' })
    expect(e.kind).toBe('roast')
    expect(e.link).toContain('123')
  })

  it('maps a $49/mo retainer hire to a "hired" event', () => {
    const e = interactionEvent({ ...base, channel: 'retainer', direction: 'out', text: 'hired Chad — $49/mo' })
    expect(e.kind).toBe('hired')
    expect(e.title).toMatch(/retainer/i)
  })

  it('returns null for internal note/out (not shown)', () => {
    expect(interactionEvent({ ...base, channel: 'note', direction: 'out', text: 'thinking' })).toBeNull()
  })
})

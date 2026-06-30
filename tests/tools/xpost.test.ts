import { describe, it, expect } from 'vitest'
import { buildTweet } from '../../tools/xpost'

// The paid adchad.ai funnel link is opt-in via `link`. @adchad summons ($5 sell) pass it; launch-thread replies get
// the fix FREE (xroast passes link:null), so their roast must carry NO link — the free fix lands as its own reply.
describe('xpost.buildTweet — paid funnel link is opt-in', () => {
  it('appends the sales link when provided (paid @adchad-mention path)', () => {
    const t = buildTweet({ text: 'this ad is cooked 👇', link: 'https://adchad.ai/p/x-acme-123' })
    expect(t.text).toContain('https://adchad.ai/p/x-acme-123')
  })

  it('omits any link when none is provided (free launch-thread fix — no paid funnel)', () => {
    const t = buildTweet({ text: 'this ad is cooked 👇', link: null })
    expect(t.text).not.toMatch(/https?:\/\//)
    expect(t.text).toBe('this ad is cooked 👇')
  })
})

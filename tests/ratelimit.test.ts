import { describe, it, expect } from 'vitest'
import { hit } from '../lib/ratelimit'

// The on-demand roast endpoint spends real money per call → a per-key limiter caps abuse.
describe('ratelimit — in-memory sliding window', () => {
  it('allows up to max within the window, then blocks', () => {
    const k = 'k-' + Math.random()
    expect(hit(k, 3, 60_000)).toBe(true)
    expect(hit(k, 3, 60_000)).toBe(true)
    expect(hit(k, 3, 60_000)).toBe(true)
    expect(hit(k, 3, 60_000)).toBe(false) // 4th is over the limit
  })
  it('isolates keys', () => {
    expect(hit('a-' + Math.random(), 1, 60_000)).toBe(true)
    expect(hit('b-' + Math.random(), 1, 60_000)).toBe(true)
  })
})

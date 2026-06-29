import { describe, it, expect } from 'vitest'
import { buyerCookieValue, verifyBuyer } from '../../lib/buyer'

// The /p/<id> link is public, so a prospect id must never authorize a charge. The buyer token (minted only after a
// real payment) is an HMAC of the prospect id — valid only for that prospect, unforgeable without the server secret.
describe('buyer token — proof-of-purchase auth', () => {
  it('accepts the token minted for the same prospect', () => {
    expect(verifyBuyer('x-acme-123', buyerCookieValue('x-acme-123'))).toBe(true)
  })
  it('rejects a token minted for a different prospect (no cross-prospect reuse)', () => {
    expect(verifyBuyer('x-victim-999', buyerCookieValue('x-acme-123'))).toBe(false)
  })
  it('rejects missing / empty / garbage tokens', () => {
    expect(verifyBuyer('x-acme-123', undefined)).toBe(false)
    expect(verifyBuyer('x-acme-123', '')).toBe(false)
    expect(verifyBuyer('x-acme-123', 'deadbeef')).toBe(false)
    expect(verifyBuyer('', buyerCookieValue('x-acme-123'))).toBe(false)
  })
})

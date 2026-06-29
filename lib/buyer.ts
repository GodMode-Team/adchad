import { createHmac, timingSafeEqual } from 'crypto'

// Proof-of-purchase token. The /p/<id> link is PUBLIC (it's posted in the roast reply on X), so a prospect id must
// never authorize a charge. After a real Stripe payment we mint this httpOnly cookie (see app/api/welcome); the
// off-session upsell + intake form require it. The token is an HMAC of the prospect id keyed by a server-only secret,
// so it can't be forged and is only ever handed to someone who actually paid for THIS prospect.
const COOKIE = 'ac_buyer'
const secret = () => process.env.STRIPE_SECRET_KEY || 'dev-secret-not-for-prod'

function token(prospectId: string): string {
  return createHmac('sha256', secret()).update(prospectId).digest('hex').slice(0, 32)
}
export function buyerCookieName(): string { return COOKIE }
export function buyerCookieValue(prospectId: string): string { return token(prospectId) }

/** True iff `cookieVal` is the valid buyer token for `prospectId`. Constant-time compare. */
export function verifyBuyer(prospectId: string, cookieVal: string | undefined | null): boolean {
  if (!cookieVal || !prospectId) return false
  const expected = token(prospectId)
  if (cookieVal.length !== expected.length) return false
  try { return timingSafeEqual(Buffer.from(cookieVal), Buffer.from(expected)) } catch { return false }
}

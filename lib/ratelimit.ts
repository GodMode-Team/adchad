// In-memory sliding-window rate limiter. ponytail: per-process (per serverless instance) — enough to blunt
// abuse on the paid on-demand roast endpoint; NOT a distributed quota. Swap for a KV store if it ever matters.
const hits = new Map<string, number[]>()

/** Returns true if this key is still under `max` within `windowMs`, recording the hit; false if over. */
export function hit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (arr.length >= max) { hits.set(key, arr); return false }
  arr.push(now)
  hits.set(key, arr)
  return true
}

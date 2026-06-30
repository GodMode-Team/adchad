import { describe, it, expect } from 'vitest'
import { buildFixCopyPrompt, FIX_ANGLES } from '../../tools/fix'

const look: any = { headline: 'h', body: 'b', offer: 'o', cta: 'Learn More', social_proof: null, real_flaws: ['generic'] }

// the team: every fix came out a before/after — "one trick pony" and "a tad overcomplicated." The fix copy must
// NOT default to a before/after split, must keep the visual simple/uncluttered, and the A/B angle rotation
// must vary (at most one of the angles leans before/after).
describe('fix — stops the before/after one-trick-pony, keeps it simple', () => {
  it('the copy prompt BANS before/after outright (a hard never, not a soft "do not default") and keeps it uncluttered', () => {
    const p = buildFixCopyPrompt(look, 'Acme', 'this ad is generic garbage')
    expect(p).toMatch(/never (use|produce)|banned/i) // hard ban — the soft "don't default" kept leaking before/afters
    expect(p).toMatch(/before.?after/i) // it names the pattern it's banning
    expect(p).toMatch(/simple|uncluttered|one .{0,10}idea|not a busy|not.{0,20}dashboard/i)
  })
  it('the A/B angle rotation is varied — not every angle is a before/after', () => {
    expect(FIX_ANGLES.length).toBeGreaterThanOrEqual(3)
    expect(FIX_ANGLES.filter((a) => /before.?after/i.test(a)).length).toBeLessThanOrEqual(1)
  })
})

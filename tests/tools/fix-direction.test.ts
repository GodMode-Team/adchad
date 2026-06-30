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
  // The $12 A/B pack must test different REASONS to click (message angles), not three looks of one message.
  it('FIX_ANGLES are distinct MESSAGE angles (different reasons to click), none a before/after', () => {
    expect(FIX_ANGLES.length).toBeGreaterThanOrEqual(3)
    for (const a of FIX_ANGLES) { expect(a.key).toBeTruthy(); expect(a.brief).toBeTruthy() }
    expect(new Set(FIX_ANGLES.map((a) => a.key)).size).toBe(FIX_ANGLES.length) // distinct
    expect(FIX_ANGLES.filter((a) => /before.?after/i.test(a.brief)).length).toBe(0)
  })

  it('buildFixCopyPrompt injects the chosen message angle into the variant', () => {
    expect(buildFixCopyPrompt(look, 'Acme', null, FIX_ANGLES[0])).toContain(FIX_ANGLES[0].brief)
  })

  // Aim Grok AT a great ad, grounded in brand/taste/ADCHAD-TASTE-PACK.md + the marketingskills ad-creative/copywriting
  // skills: one big idea, a headline formula, concrete proof, Meta char limits, and the corporate-slop filler to ban.
  it('encodes the positive ad-craft rubric (grounded, with headline formulas + Meta limits)', () => {
    const p = buildFixCopyPrompt(look, 'Acme', 'this ad is generic garbage')
    expect(p).toMatch(/one big idea|single .{0,20}promise/i)
    expect(p).toMatch(/proof/i)
    expect(p).toMatch(/elevate|unlock|seamless|streamline|optimize/i)  // names the slop filler to avoid
    expect(p).toMatch(/125|front-load|≤ ?40|character/i)               // Meta field limits + front-load the hook
    expect(p).toMatch(/without|never .* again|category.{0,6}for/i)     // a proven headline formula
    expect(p).toMatch(/marketingskills/i)                              // cited source
  })
})

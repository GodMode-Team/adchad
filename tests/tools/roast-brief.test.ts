import { describe, it, expect } from 'vitest'
import { roastBrief } from '../../tools/roast'

// the team: don't fake-roast a genuinely good ad. A strong ad (vision score >= 70) gets respect + one real
// improvement + "here's another angle"; a weak ad gets the savage roast.
const look = (score: number): any => ({
  headline: 'h', body: 'b', offer: 'o', cta: 'c', social_proof: null, visual: 'v', real_flaws: [], score, verdict: 'v',
})

describe('roast — good ads get feedback + another angle, not a fake roast', () => {
  it('a strong ad (score >= 70) → respect + another angle, no insults', () => {
    const b = roastBrief(look(82))
    expect(b.system).toMatch(/another angle/i)
    expect(b.system).not.toMatch(/dogshit|garbage|terrible/i) // not the savage prompt
    expect(b.instruction).toMatch(/angle|improve|respect|don.t roast/i)
  })

  it('a weak ad (score < 70) → the savage roast', () => {
    const b = roastBrief(look(25))
    expect(b.instruction).toMatch(/roast this ad/i)
    expect(b.system).toMatch(/savage|brutal|dogshit/i)
  })
})

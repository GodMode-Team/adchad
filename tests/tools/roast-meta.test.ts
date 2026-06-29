import { describe, it, expect } from 'vitest'
import { META_AD_NOTE } from '../../tools/roast'

// the team's note: Meta's CTA button is a FIXED dropdown label — you pick it, you can't restyle it. Roasting the
// button's *look* is a tell that you don't know Meta ads. The roast context must steer Grok to critique the CTA
// *choice* (and the headline/body/creative), never the button's design.
describe('roast — Meta-aware CTA guardrail', () => {
  it('tells Grok the Meta CTA button is fixed and must not be mocked for its look', () => {
    expect(META_AD_NOTE).toMatch(/fixed/i)
    expect(META_AD_NOTE).toMatch(/Book Now/i)
    expect(META_AD_NOTE).toMatch(/restyle|redesign|look|design/i)
  })
})

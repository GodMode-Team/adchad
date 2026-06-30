import { describe, it, expect } from 'vitest'
import { fixEmailBody } from '../../tools/fulfill'

// The $5 single fix delivers one headline/body/cta + one creative. The $12 A/B pack now delivers per-ANGLE
// variants — each with its OWN copy — so the email must render each variant's angle + copy + creative.
describe('fulfill — email renders per-angle variants for the A/B pack', () => {
  const single: any = { imageUrl: 'i', imageUrls: ['i'], headline: 'Cut Your $47k IRS Bill to $9k', body: 'Real settlements protect your wages.', cta: 'Get Quote', fixed: ['x'], cost: 0 }
  const pack: any = {
    imageUrl: 'i1', imageUrls: ['i1', 'i2', 'i3'], headline: 'H1', body: 'B1', cta: 'Get Quote', fixed: [], cost: 0,
    variants: [
      { angle: 'pain', headline: 'H1', body: 'B1', cta: 'Get Quote', imageUrl: 'i1' },
      { angle: 'outcome', headline: 'H2', body: 'B2', cta: 'Sign Up', imageUrl: 'i2' },
      { angle: 'proof', headline: 'H3', body: 'B3', cta: 'Learn More', imageUrl: 'i3' },
    ],
  }

  it('single fix: one headline/body/cta + its creative, no variant blocks', () => {
    const b = fixEmailBody(single)
    expect(b).toContain('Cut Your $47k IRS Bill to $9k')
    expect(b).toContain('Get Quote')
    expect(b).toContain('i')
    expect(b).not.toMatch(/VARIANT 2/i)
  })

  it('A/B pack: every variant’s angle + its distinct copy + its creative', () => {
    const b = fixEmailBody(pack)
    expect(b).toMatch(/PAIN/i)
    expect(b).toMatch(/OUTCOME/i)
    expect(b).toMatch(/PROOF/i)
    expect(b).toContain('H2') // variant 2's distinct headline
    expect(b).toContain('B3') // variant 3's distinct body
    expect(b).toContain('i2') // variant 2's own creative
    expect(b).toMatch(/VARIANT 3/i)
  })
})

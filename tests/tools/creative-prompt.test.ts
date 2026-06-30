import { describe, it, expect } from 'vitest'
import { buildPrompt, stripComparison } from '../../tools/creative'

// A Meta ad = a CREATIVE image + separate native fields (Primary text / Headline / CTA). Infographics/data-viz
// make great creatives; the only things we must NOT bake in are the marketing headline-banner and a CTA button
// (those duplicate the native fields and the drawn button is a dead pixel).
describe('creative — single-panel, before/after stripped deterministically', () => {
  const fix = {
    headline: 'Cut GPU Spend 40% With Fixed AI Scaling',
    body: 'Locked monthly performance + 3x throughput',
    cta: 'See Exact Numbers',
    // the copy model keeps writing a before/after direction for savings offers, ignoring the prose ban
    creativeDirection: 'a clean before/after of a volatile cost line flattening out, premium dark studio look',
  }

  it('welcomes data-viz/infographic, bakes no headline/CTA', () => {
    const p = buildPrompt(fix, 'NVIDIA')
    expect(p).not.toMatch(/render (this )?text/i)              // no "bake the headline/CTA in" instruction
    expect(p).not.toContain(fix.headline)                     // marketing headline is NOT fed to the image…
    expect(p).not.toContain(fix.cta)                          // …nor the CTA label
    expect(p).toMatch(/infographic|data-viz|chart/i)          // infographics ARE welcome
    expect(p).toMatch(/no\b.{0,30}(button|call-to-action)/i)  // …but no drawn CTA button
    expect(p).toMatch(/simple|uncluttered|one clear|single .{0,12}panel/i)
  })

  // the team (recurring): EVERY creative kept coming out a before/after — "one trick pony" — despite a prose ban in
  // BOTH the copy prompt and here. Prose bans are ignored (the copy model writes a before/after direction; the image
  // model draws the concept it's handed). The only fix that holds: strip the comparison framing in CODE.
  it('NEVER lets a before/after concept reach the image model, even when the direction asks for one', () => {
    const p = buildPrompt(fix, 'NVIDIA')
    expect(p).not.toMatch(/before\s*[-/&]?\s*(and\s+|vs\.?\s+)?after|after\s*[-/&]?\s*before|side.?by.?side|split.?screen|\bvs\.?\b/i)
    expect(p).toMatch(/single (unified )?panel|one (unified )?(frame|panel)/i) // positively framed as one panel
    expect(p).toMatch(/flattening/i)                                            // the useful part of the direction survives
  })

  it('stripComparison removes the comparison framing but keeps a clean concept untouched', () => {
    expect(stripComparison('a clean before/after of a volatile cost line flattening out, premium dark studio look'))
      .not.toMatch(/before\s*[-/&]?\s*after|side.?by.?side/i)
    expect(stripComparison('BEFORE vs AFTER: spend cut 72%')).not.toMatch(/before|after|\bvs\b/i)
    expect(stripComparison('a split-screen pre vs post comparison')).not.toMatch(/split|pre|post|\bvs\b|comparison/i)
    // a single-panel concept passes through unchanged
    expect(stripComparison('one bold hero stat on dark premium bg')).toBe('one bold hero stat on dark premium bg')
  })

  // Don't just fence the model away from bad — aim it AT good. Distilled craft principles from
  // brand/taste/ADCHAD-TASTE-PACK.md so gpt-image-2 has a positive target, not only "no before/after".
  it('encodes the positive craft bar (dominant focal element, contrast/hierarchy, negative space, real-not-slop)', () => {
    const p = buildPrompt({ headline: 'h', creativeDirection: 'a hero product shot' }, 'Acme')
    expect(p).toMatch(/dominant focal|focal element/i)
    expect(p).toMatch(/negative space|breathing room/i)
    expect(p).toMatch(/contrast|hierarchy/i)
    expect(p).toMatch(/real|credible|ready-to-run/i)
  })
})

import { describe, it, expect } from 'vitest'
import { buildPrompt } from '../../tools/creative'

// A Meta ad = a CREATIVE image + separate native fields (Primary text / Headline / CTA). Infographics/data-viz
// make great creatives; the only things we must NOT bake in are the marketing headline-banner and a CTA button
// (those duplicate the native fields and the drawn button is a dead pixel).
describe('creative — prompt allows infographics but bakes no headline/CTA', () => {
  const fix = {
    headline: 'Cut GPU Spend 40% With Fixed AI Scaling',
    body: 'Locked monthly performance + 3x throughput',
    cta: 'See Exact Numbers',
    creativeDirection: 'a clean before/after of a volatile cost line flattening out, premium dark studio look',
  }

  it('welcomes data-viz/infographic, forbids the headline-banner and CTA button', () => {
    const p = buildPrompt(fix, 'NVIDIA')
    expect(p).not.toMatch(/render (this )?text/i)              // no "bake the headline/CTA in" instruction
    expect(p).not.toContain(fix.headline)                     // marketing headline is NOT fed to the image…
    expect(p).not.toContain(fix.cta)                          // …nor the CTA label
    expect(p).toMatch(/infographic|data-viz|chart|before.?after/i) // infographics ARE welcome
    expect(p).toMatch(/no\b.{0,30}(button|call-to-action)/i)  // …but no drawn CTA button
    expect(p).toContain(fix.creativeDirection)                // the visual concept drives it
  })

  // the team (recurring): every creative kept coming out a before/after — "one trick pony". The soft "don't default"
  // didn't hold, so the prompt now BANS it outright.
  it('BANS before/after outright (hard never) and pushes a simple, uncluttered visual', () => {
    const p = buildPrompt({ headline: 'h', body: 'b', cta: 'Learn More', creativeDirection: 'a clean product hero shot' }, 'Acme')
    expect(p).toMatch(/never (produce|use)|banned/i) // hard ban, not the old soft "don't default"
    expect(p).toMatch(/simple|uncluttered|one clear.{0,10}idea|not a busy|not.{0,20}dashboard/i) // and not overcomplicated
  })
})

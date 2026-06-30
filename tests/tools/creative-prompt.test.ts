import { describe, it, expect } from 'vitest'
import { renderFbMockPng, renderCreativePng, type FbMockSpec } from '../../tools/render/fb-mock'

// The creative is now rendered DETERMINISTICALLY as a finished Meta-feed mockup — the image model never draws the
// copy, so the slop class (AI-meat, generic dashboards, mangled text) AND the before/after one-trick-pony are gone
// by construction (a deterministic graphic can't draw a before/after). These tests prove the renderer produces a
// real PNG from a structured spec, the bare uploadable asset, and is robust to a minimal spec.
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47]

describe('creative — deterministic FB-mockup render', () => {
  it('renders a full spec to a real PNG (the FB mockup / lead-tweet proof)', async () => {
    const spec: FbMockSpec = {
      brand: 'Aphrodite', headline: "The Double Kebda Everyone's Posting",
      body: 'Most liver sandwiches are sad and dry. Ours are not. Two for 145 LE today only.',
      cta: 'Order Now', was: 'Double Livers + Rolls: 145',
      creative: { kicker: 'FIRE-GRILLED', hero: 'DOUBLE', hero2: 'KEBDA', subline: 'stacked livers', offer: '2 / 145 LE', offerLabel: 'DINE-IN', urgency: 'TODAY ONLY', accent: 'warm' },
    }
    const png = await renderFbMockPng(spec)
    expect(png.length).toBeGreaterThan(10_000)
    expect([...png.slice(0, 4)]).toEqual(PNG_MAGIC)
  }, 30_000)

  it('renders the BARE uploadable creative (no FB chrome) — the asset the buyer drops into Meta', async () => {
    const spec: FbMockSpec = {
      brand: 'Aphrodite', headline: 'h', body: 'b', cta: 'Order Now',
      creative: { kicker: 'FRESH', hero: 'DOUBLE', hero2: 'KEBDA', offer: '2 / 145 LE', accent: 'warm' },
    }
    const png = await renderCreativePng(spec)
    expect(png.length).toBeGreaterThan(10_000)
    expect([...png.slice(0, 4)]).toEqual(PNG_MAGIC)
  }, 30_000)

  it('survives a minimal spec (no kicker/offer/urgency, unknown accent → palette falls back)', async () => {
    const spec: FbMockSpec = {
      brand: 'X', headline: 'A clear, specific outcome', body: 'One short line.', cta: 'Learn More',
      creative: { hero: 'BIG IDEA', accent: 'nope' as any },
    }
    const png = await renderFbMockPng(spec)
    expect([...png.slice(0, 4)]).toEqual(PNG_MAGIC)
  }, 30_000)
})

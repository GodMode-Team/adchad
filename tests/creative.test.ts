import { describe, it, expect } from 'vitest'
import { generate } from '../lib/creative'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('Spec 08 — creative image gen (live OpenRouter / Nano Banana, no mocks)', () => {
  it('generates a real static ad image from the fix copy', async () => {
    const r = await generate(
      { headline: 'Stop overpaying for AC repair', cta: 'Get a free quote', creativeDirection: 'bold, high-contrast, trustworthy' },
      'CoolAir HVAC',
    )
    expect(r.imageUrl).toMatch(/^\/fixes\/.+\.png$/)

    const path = join(process.cwd(), 'public', r.imageUrl)
    expect(existsSync(path)).toBe(true)
    const buf = readFileSync(path)
    expect(buf.length).toBeGreaterThan(5000) // a real image, not an error blob
    expect(buf.subarray(0, 4).toString('hex')).toBe('89504e47') // PNG magic bytes
    console.log(`\n  GENERATED AD: ${r.imageUrl} (${Math.round(buf.length / 1024)} KB)\n`)
  }, 60_000)
})

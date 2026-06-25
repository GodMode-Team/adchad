import { describe, it, expect, beforeAll } from 'vitest'
import { scan } from '../lib/foreplay'
import { fulfill } from '../lib/fulfill'
import { migrate, sql } from '../lib/db'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

describe('Spec 05 (fulfillment core) — live, no mocks', () => {
  let prospectId: string
  beforeAll(async () => {
    await migrate()
    await scan('hvac repair', 8)
    const [p] = await sql<any[]>`select brand_id from ads where copy is not null and brand_id is not null limit 1`
    prospectId = p.brand_id
  }, 60_000)

  it('rewrites the ad and generates a real ad image', async () => {
    const fix = await fulfill({ prospect_id: prospectId })
    expect(fix.headline.length).toBeGreaterThan(3)
    expect(fix.body.length).toBeGreaterThan(10)
    expect(fix.cta.length).toBeGreaterThan(1)
    expect(fix.imageUrl).toMatch(/^\/fixes\/.+\.png$/)
    expect(existsSync(join(process.cwd(), 'public', fix.imageUrl))).toBe(true)
    console.log(`\n  FIX → "${fix.headline}" | CTA: ${fix.cta} | img: ${fix.imageUrl}\n`)
  }, 90_000)
})

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { toImageUrl } from '../../tools/vision'

// The Nvidia flail: the operator handed AdChad an ad as a LOCAL file (Slack attachment in the
// image cache), but vision/roast only spoke image URLs. toImageUrl bridges local file -> data URL
// so the agent never has to `base64`/`ls`/`file`-fumble it again.
const PNG = Buffer.from('89504e470d0a1a0a', 'hex') // a 8-byte PNG magic header is enough to encode
const file = join(tmpdir(), `adchad-vision-${Date.now().toString(36)}.png`)

describe('vision tool — toImageUrl (local file -> data URL bridge)', () => {
  beforeAll(() => writeFileSync(file, PNG))
  afterAll(() => rmSync(file, { force: true }))

  it('passes http(s) URLs through untouched', () => {
    const u = 'https://example.com/ad.jpg'
    expect(toImageUrl(u)).toBe(u)
  })

  it('passes existing data: URLs through untouched', () => {
    const u = 'data:image/png;base64,AAAA'
    expect(toImageUrl(u)).toBe(u)
  })

  it('reads a local file into a base64 data URL with the right mime', () => {
    const out = toImageUrl(file)
    expect(out).toBe(`data:image/png;base64,${PNG.toString('base64')}`)
  })

  it('throws a clear error when the local file is missing', () => {
    expect(() => toImageUrl(join(tmpdir(), 'adchad-nope-does-not-exist.png'))).toThrow(/not found/i)
  })
})

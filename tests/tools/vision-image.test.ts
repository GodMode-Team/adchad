import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { toImageUrl, parseJsonObject } from '../../tools/vision'

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

// The on-box crash: gemini returned a valid JSON object followed by prose containing a brace, and the
// greedy /\{[\s\S]*\}/ match grabbed both -> JSON.parse blew up mid-roast. parseJsonObject extracts the
// FIRST complete object, ignoring fences, trailing prose, and braces inside strings.
describe('vision tool — parseJsonObject (robust model-JSON extraction)', () => {
  const obj = { headline: 'Buy now', body: 'a { brace } in a string', nested: { cta: 'Go' } }

  it('parses a clean JSON object', () => {
    expect(parseJsonObject(JSON.stringify(obj))).toEqual(obj)
  })

  it('extracts the object when the model appends prose containing a brace', () => {
    expect(parseJsonObject(`${JSON.stringify(obj)}\n\nNote: roast it {hard}.`)).toEqual(obj)
  })

  it('unwraps a ```json fenced block', () => {
    expect(parseJsonObject('```json\n' + JSON.stringify(obj) + '\n```')).toEqual(obj)
  })

  it('respects braces inside string values (no premature close)', () => {
    expect(parseJsonObject(JSON.stringify(obj)).body).toBe('a { brace } in a string')
  })

  it('returns {} when there is no object at all', () => {
    expect(parseJsonObject('the model refused, no json here')).toEqual({})
  })
})

import { describe, it, expect } from 'vitest'
import { X_POST_STYLE } from '../../tools/roast'

// the team's feedback: the X roast read as one dense wall-of-text paragraph and the CTA was a vague
// "Want Chad to just fix it? $5." X posts must be scannable (short lines / line breaks), dialled back in
// length, and end with a confident, DIRECTIVE CTA that points down to the appended sales link with a 👇.
describe('roast — X post style (scannable + directive 👇 CTA)', () => {
  it('tells the model to break the roast into short lines, not a wall of text', () => {
    expect(X_POST_STYLE).toMatch(/line break|short.{0,12}line|scannable|wall.?of.?text/i)
  })
  it('demands a directive CTA that points to the link with a 👇 (not a vague question)', () => {
    expect(X_POST_STYLE).toContain('👇')
    expect(X_POST_STYLE).toMatch(/directive|points? (down )?to|call to action|action/i)
  })
  it('keeps it tight — dial back unnecessary length', () => {
    expect(X_POST_STYLE).toMatch(/tight|trim|cut|filler|shorter/i)
  })
})

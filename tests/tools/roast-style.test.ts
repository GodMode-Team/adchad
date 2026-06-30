import { describe, it, expect } from 'vitest'
import { X_POST_STYLE, stripUrls, salesLink, spaceBeats } from '../../tools/roast'

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

  // The chadfix.com incident: told "the link is appended, point down to it", Grok invented a sales URL
  // (chadfix.com/5) and baked it into the post body. The model must NEVER write a URL of its own.
  it('forbids the model from writing its own URL/domain (the real link is auto-attached)', () => {
    expect(X_POST_STYLE).toMatch(/(never|don.?t|no).{0,40}(url|link|domain)/i)
    expect(X_POST_STYLE).toMatch(/attached|appended|automatic/i)
  })
})

// Deterministic backstop: even if the model ignores the prompt, no fabricated link reaches a public post.
describe('roast — stripUrls keeps fabricated sales links out of the post', () => {
  it('removes a hallucinated scheme URL but keeps the roast + 👇 CTA', () => {
    const post = "this ad is slop.\n\nhttps://chadfix.com/5\n\nHere, I'll unfuck it for you. You're welcome 👇"
    const out = stripUrls(post)
    expect(out).not.toMatch(/chadfix|https?:\/\//i)
    expect(out).toContain('👇')
    expect(out).toContain('unfuck it for you')
  })
  it('removes a bare domain + path too', () => {
    expect(stripUrls('go to chadfix.com/5 now')).not.toMatch(/chadfix\.com/i)
  })
  it('leaves a link-free roast untouched (aside from trim)', () => {
    const post = '@brand this ad is weak.\nNo proof, no offer.\nClick if you want me to fix it 👇'
    expect(stripUrls(post)).toBe(post)
  })
})

// Grok is inconsistent — sometimes a single \n between beats, sometimes \n\n — so the tweet randomly reads single- or
// double-spaced. spaceBeats forces a blank line between EVERY beat so every roast (tweet + funnel) is consistently readable.
describe('roast — spaceBeats forces a blank line between every beat', () => {
  it('turns single line breaks into a blank line between beats', () => {
    expect(spaceBeats('beat one\nbeat two\nbeat three')).toBe('beat one\n\nbeat two\n\nbeat three')
  })
  it('normalizes already-double and 3+ runs to exactly one blank line each', () => {
    expect(spaceBeats('a\n\n\nb\nc')).toBe('a\n\nb\n\nc')
  })
  it('drops empty / whitespace-only lines and trims each beat', () => {
    expect(spaceBeats('  a  \n\n   \n b ')).toBe('a\n\nb')
  })
})

// Every roast must carry our REAL link — never a *.vercel.app or a hallucinated domain (project rule: always adchad.ai).
describe('roast — salesLink is always an adchad.ai URL', () => {
  it('builds the per-prospect /p/<id> link by default', () => {
    const old = process.env.APP_URL; delete process.env.APP_URL
    expect(salesLink('x-taxquotes-12345678')).toBe('https://adchad.ai/p/x-taxquotes-12345678')
    expect(salesLink()).toBe('https://adchad.ai') // no prospect → the funnel home
    if (old !== undefined) process.env.APP_URL = old
  })
  it('honours APP_URL when set', () => {
    const old = process.env.APP_URL; process.env.APP_URL = 'http://localhost:3000'
    expect(salesLink('abc')).toBe('http://localhost:3000/p/abc')
    if (old === undefined) delete process.env.APP_URL; else process.env.APP_URL = old
  })
})

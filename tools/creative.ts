import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { costUsdOf } from './cost'

// gpt-image-2 via OpenRouter's Unified Image API — excellent at rendering in-image text.
const MODEL = process.env.MODEL_IMAGE || 'openai/gpt-image-2'
const IMG_FALLBACK_USD = 0.04 // gpt-image-2 1024² list price — used only if the image endpoint doesn't return usage.cost

type Fix = { headline: string; body?: string | null; cta?: string | null; creativeDirection?: string | null }

// The copy model (Grok) keeps writing a before/after "direction" for savings offers, and gpt-image-2 faithfully
// DRAWS whatever concept it's handed — so a prose "no before/after" ban (in the copy prompt AND here) never holds.
// The only thing that does: strip the comparison framing out of the direction in CODE before the image model sees
// it, leaving the real concept (e.g. "a cost line flattening out") to render as a single panel.
// Does the direction even smell like a comparison? (cheap gate — leave clean directions untouched.)
const COMPARISON_HINT =
  /\b(before|after|versus|vs\.?|comparisons?|split[\s-]?(screen|panel|view)|two[\s-]?(panel|column)|pre[\s-/]?post)\b|side[\s-]?by[\s-]?side|\bleft\b[\s\S]{0,40}\bright\b/i

// When it does, DEMOLISH every two-state token — a before/after gets phrased a dozen ways ("BEFORE panel" / "left vs
// right" / "pre→post" / "dark side, green side"), so we strip them all rather than play whack-a-mole with one pattern.
const COMPARISON_TOKENS = new RegExp(
  [
    'before\\s*[-/&:]?\\s*(and\\s+|vs\\.?\\s+)?after',
    'after\\s*[-/&:]?\\s*before',
    '\\bbefore\\b', '\\bafter\\b', '\\bb\\s*/\\s*a\\b',
    'side[\\s-]?by[\\s-]?side',
    'split[\\s-]?(screen|panel|view)?',
    'two[\\s-]?(panel|column|half|side)s?',
    '(on\\s+the\\s+)?\\b(left|right)\\b[\\s-]?(half|side|panel|column|frame)?',
    'pre[\\s-]?(vs\\.?|/|to|and|-|→)?\\s*post',
    '\\bvs\\.?\\b', 'versus', '\\bcomparisons?\\b', '\\bcompar(?:e|ing)\\b',
    '(dark|light)\\s*(vs\\.?|/|to)\\s*(dark|light)',
  ].join('|'),
  'gi',
)

/** Strip before/after & side-by-side framing from a creative direction (pure, testable). A clean single-panel
 *  direction passes through untouched; a comparison one is demolished and re-cast as a single improved end-state,
 *  because gpt-image-2 draws whatever concept it's handed and a prose "no before/after" ban never holds. */
export function stripComparison(direction?: string | null): string {
  const raw = (direction || '').trim()
  if (!raw || !COMPARISON_HINT.test(raw)) return raw
  const core = raw
    .replace(COMPARISON_TOKENS, ' ')
    // a "from $468K to $129K" pair is itself a before/after — keep ONLY the winning (second) number, so there's
    // no higher figure left to anchor a "before" bar/state.
    .replace(/\b(?:from\s+)?\$?\d[\d.,]*\s*[kmb%]?\s*(?:→|->|–|—|to|down\s+to|dropping\s+to)\s*(\$?\d[\d.,]*\s*[kmb%]?)/gi, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/[,;:]\s*(?=[,;:])/g, '')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/^[\s,;:.\-]+|[\s,;:.\-]+$/g, '')
    .trim()
  // comparison detected → force a single end-state hero stat (one figure, the win only — never a "before" half)
  return `a single bold hero panel showing ONLY the final improved result as one figure${core.length >= 4 ? `: ${core}` : ''}`
}

/** The image is the CREATIVE; the ad's copy (headline/body/CTA) goes in Meta's native fields. Infographics and
 *  data-viz ARE great creatives — the only things we must not bake in are the marketing headline-banner and a
 *  CTA button (those duplicate the native fields, and a drawn button isn't clickable). */
export function buildPrompt(fix: Fix, brand?: string | null): string {
  const concept = stripComparison(fix.creativeDirection) || `a bold, premium product visual for ${brand || 'the brand'}`
  return (
    `Design ONE scroll-stopping 1:1 Meta ad CREATIVE. Concept: ${concept}.\n` +
    `Compose it as ONE single unified panel — one frame, one focal idea, one consistent palette across the whole image.\n` +
    `Keep it SIMPLE and uncluttered — ONE clear visual idea, not a busy multi-panel dashboard crammed with tiny numbers. ` +
    `An infographic / data-viz / one bold hero stat / a clean diagram is welcome where it genuinely proves the point.\n` +
    `Craft bar (premium, not AI slop): ONE dominant focal element — the hero stat / product / proof — large, with generous ` +
    `negative space; strong visual hierarchy and high contrast so it's instantly legible at thumbnail size; a restrained ` +
    `palette built on ONE accent color; real, credible texture (a believable product, photo, or document) over generic ` +
    `clip-art, gradients, or a stock "team at a laptop". It must read like a real, ready-to-run ad, not an AI render.\n` +
    `Do NOT render the ad's marketing copy: no big headline banner, no paragraph of body copy, and NO ` +
    `call-to-action button — that copy lives in Meta's native fields and a drawn button isn't clickable.\n` +
    `No brand name, no logo, no watermark. Finished and high-end, ready to run.`
  )
}

/** Generate a drop-in-ready VISUAL ad creative (the copy goes in Meta's native fields, not the image). */
export async function generate(fix: Fix, brand?: string | null): Promise<{ imageUrl: string; costUsd: number }> {
  const prompt = buildPrompt(fix, brand)

  const res = await fetch('https://openrouter.ai/api/v1/images', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, prompt, size: '1024x1024', usage: { include: true } }),
  })
  if (!res.ok) throw new Error(`image gen ${res.status}: ${(await res.text()).slice(0, 200)}`)

  const j: any = await res.json()
  const costUsd = costUsdOf(j) || IMG_FALLBACK_USD // real cost if the endpoint itemizes it, else list price
  const d = j.data?.[0] ?? j.images?.[0] ?? {}
  const b64: string | undefined = d.b64_json ?? (typeof d === 'string' ? d : undefined)
  const url: string | undefined = d.url ?? d.image_url?.url
  let buf: Buffer
  if (b64) buf = Buffer.from(b64.startsWith('data:') ? b64.split(',')[1] : b64, 'base64')
  else if (url) buf = Buffer.from(await (await fetch(url)).arrayBuffer())
  else throw new Error('no image returned from ' + MODEL + ': ' + JSON.stringify(j).slice(0, 200))

  const name = `${randomUUID()}.png`
  // Host on Vercel Blob so the deployed funnel can serve it (the agent and the web app don't share a disk).
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob')
    const { url } = await put(`fixes/${name}`, buf, { access: 'public', contentType: 'image/png', token: process.env.BLOB_READ_WRITE_TOKEN })
    return { imageUrl: url, costUsd }
  }
  // local fallback (no blob token)
  const dir = join(process.cwd(), 'public', 'fixes')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, name), buf)
  return { imageUrl: `/fixes/${name}`, costUsd }
}

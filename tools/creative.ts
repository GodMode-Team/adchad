import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { costUsdOf } from './cost'

// gpt-image-2 via OpenRouter's Unified Image API — excellent at rendering in-image text.
const MODEL = process.env.MODEL_IMAGE || 'openai/gpt-image-2'
const IMG_FALLBACK_USD = 0.04 // gpt-image-2 1024² list price — used only if the image endpoint doesn't return usage.cost

type Fix = { headline: string; body?: string | null; cta?: string | null; creativeDirection?: string | null }

/** The image is the CREATIVE; the ad's copy (headline/body/CTA) goes in Meta's native fields. Infographics and
 *  data-viz ARE great creatives — the only things we must not bake in are the marketing headline-banner and a
 *  CTA button (those duplicate the native fields, and a drawn button isn't clickable). */
export function buildPrompt(fix: Fix, brand?: string | null): string {
  const concept = fix.creativeDirection?.trim() || `a bold, premium product visual for ${brand || 'the brand'}`
  return (
    `Design ONE scroll-stopping 1:1 Meta ad CREATIVE. Concept: ${concept}.\n` +
    `Keep it SIMPLE and uncluttered — ONE clear visual idea, not a busy multi-panel dashboard crammed with tiny numbers.\n` +
    `An infographic / data-viz is welcome where it genuinely proves the point, but do NOT default to a before/after split — ` +
    `that pattern is overused; reach for it only when the concept truly calls for it. Otherwise lead with a single strong ` +
    `image (a hero product/lifestyle shot, one bold stat, a clean diagram) plus only the structural labels it needs.\n` +
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

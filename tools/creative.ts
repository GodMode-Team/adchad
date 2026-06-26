import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Nano Banana via OpenRouter — no separate image key needed.
const MODEL = process.env.MODEL_IMAGE || 'google/gemini-2.5-flash-image'

type Fix = { headline: string; body?: string | null; cta?: string | null; creativeDirection?: string | null }

/** Generate a real static ad image from the fix copy; save under public/fixes; return its served path. */
export async function generate(fix: Fix, brand?: string | null): Promise<{ imageUrl: string }> {
  // Generate a clean VISUAL only — image models garble baked-in text, so the rewritten copy
  // is delivered as text alongside (the fulfillment email + the sales page carry the words).
  const prompt =
    `Create ONE scroll-stopping, premium advertising VISUAL for this product.\n` +
    `Concept/mood to evoke (do NOT render this as text): "${fix.headline}"\n` +
    (brand ? `Brand vibe: ${brand}.\n` : '') +
    `Style: ${fix.creativeDirection || 'clean, modern, high-contrast, professional, photographic'}.\n` +
    `CRITICAL: NO text, NO words, NO letters, NO logos, NO watermark anywhere in the image. ` +
    `Compose with clean negative space near the top so a headline can be added later. A finished, premium photograph — not a mockup or template.`

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, modalities: ['image', 'text'], messages: [{ role: 'user', content: prompt }] }),
  })
  if (!res.ok) throw new Error(`image gen ${res.status}: ${(await res.text()).slice(0, 200)}`)

  const j: any = await res.json()
  const dataUrl: string | undefined = j.choices?.[0]?.message?.images?.[0]?.image_url?.url
  if (!dataUrl?.startsWith('data:image')) throw new Error('no image returned from ' + MODEL)

  const buf = Buffer.from(dataUrl.split(',')[1], 'base64')
  const name = `${randomUUID()}.png`
  const dir = join(process.cwd(), 'public', 'fixes')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, name), buf)
  return { imageUrl: `/fixes/${name}` }
}

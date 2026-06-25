import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Nano Banana via OpenRouter — no separate image key needed.
const MODEL = process.env.MODEL_IMAGE || 'google/gemini-2.5-flash-image'

type Fix = { headline: string; body?: string | null; cta?: string | null; creativeDirection?: string | null }

/** Generate a real static ad image from the fix copy; save under public/fixes; return its served path. */
export async function generate(fix: Fix, brand?: string | null): Promise<{ imageUrl: string }> {
  const prompt =
    `Design ONE scroll-stopping static Meta ad image.\n` +
    `Headline (large, bold, legible): "${fix.headline}"\n` +
    (fix.cta ? `Clear CTA button: "${fix.cta}"\n` : '') +
    (brand ? `Brand: ${brand}.\n` : '') +
    `Style: ${fix.creativeDirection || 'clean, modern, high-contrast, professional'}.\n` +
    `A real finished ad — not a mockup, template, or watermark.`

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

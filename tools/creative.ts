import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// gpt-image-2 via OpenRouter's Unified Image API — excellent at rendering in-image text.
const MODEL = process.env.MODEL_IMAGE || 'openai/gpt-image-2'

type Fix = { headline: string; body?: string | null; cta?: string | null; creativeDirection?: string | null }

/** Generate a finished, drop-in-ready static ad — the model renders the headline + CTA text in-image (crisp). */
export async function generate(fix: Fix, _brand?: string | null): Promise<{ imageUrl: string }> {
  const prompt =
    `Design ONE finished, scroll-stopping static Meta ad image, ready to run.\n` +
    `Render this text EXACTLY as written, perfectly spelled, large and legible:\n` +
    `• Bold headline: "${fix.headline}"\n` +
    (fix.body ? `• Smaller support / offer line: "${fix.body}"\n` : '') +
    (fix.cta ? `• A rounded CTA button labeled: "${fix.cta}"\n` : '') +
    `Style: ${fix.creativeDirection || 'clean, modern, premium, high-contrast, professional photography'}.\n` +
    `NO brand name, NO logo, NO watermark. A real, finished ad — not a mockup or template.`

  const res = await fetch('https://openrouter.ai/api/v1/images', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, prompt, size: '1024x1024' }),
  })
  if (!res.ok) throw new Error(`image gen ${res.status}: ${(await res.text()).slice(0, 200)}`)

  const j: any = await res.json()
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
    return { imageUrl: url }
  }
  // local fallback (no blob token)
  const dir = join(process.cwd(), 'public', 'fixes')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, name), buf)
  return { imageUrl: `/fixes/${name}` }
}

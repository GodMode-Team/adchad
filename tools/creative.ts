import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

// Nano Banana via OpenRouter — no separate image key needed.
const MODEL = process.env.MODEL_IMAGE || 'google/gemini-2.5-flash-image'

type Fix = { headline: string; body?: string | null; cta?: string | null; creativeDirection?: string | null }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function wrap(text: string, maxChars: number): string[] {
  const lines: string[] = []
  let cur = ''
  for (const w of text.split(/\s+/)) {
    if (cur && (cur + ' ' + w).length > maxChars) { lines.push(cur); cur = w }
    else cur = cur ? cur + ' ' + w : w
  }
  if (cur) lines.push(cur)
  return lines
}

/** Ad overlay: top/bottom scrims for legibility, a wrapped headline, and a CTA pill — sized to the image. */
function overlaySvg(W: number, H: number, fix: Fix): string {
  const pad = Math.round(W * 0.06)
  const hSize = Math.round(W * 0.058)
  const lineH = Math.round(hSize * 1.16)
  const hLines = wrap(fix.headline, Math.max(8, Math.floor((W - 2 * pad) / (hSize * 0.5)))).slice(0, 4)
  const head = hLines.map((l, i) => `<tspan x="${pad}" dy="${i === 0 ? 0 : lineH}">${esc(l)}</tspan>`).join('')

  const cta = fix.cta ? esc(fix.cta.toUpperCase()) : ''
  const cSize = Math.round(W * 0.032)
  const cPadX = Math.round(cSize * 1.0)
  const cH = Math.round(cSize * 2.3)
  const cW = Math.round(cta.length * cSize * 0.6) + cPadX * 2
  const cY = H - pad - cH

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.6"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <linearGradient id="b" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
  </defs>
  <rect x="0" y="0" width="${W}" height="${Math.round(H * 0.5)}" fill="url(#t)"/>
  <rect x="0" y="${Math.round(H * 0.62)}" width="${W}" height="${Math.round(H * 0.38)}" fill="url(#b)"/>
  <text x="${pad}" y="${pad + hSize}" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="${hSize}">${head}</text>
  ${cta ? `<rect x="${pad}" y="${cY}" rx="${Math.round(cH / 2)}" width="${cW}" height="${cH}" fill="#fff"/>
  <text x="${pad + cW / 2}" y="${cY + cH / 2 + cSize * 0.36}" fill="#0a0a0a" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${cSize}" letter-spacing="0.5" text-anchor="middle">${cta}</text>` : ''}
</svg>`
}

/** Generate a drop-in-ready static ad: AI visual (Nano Banana) + crisp composited headline + CTA. */
export async function generate(fix: Fix, brand?: string | null): Promise<{ imageUrl: string }> {
  // 1. clean VISUAL only — the model garbles baked text, so we composite the words ourselves (step 2).
  const prompt =
    `Create ONE scroll-stopping, premium advertising VISUAL for this product.\n` +
    `Mood/concept to evoke (do NOT render as text): "${fix.headline}"\n` +
    (brand ? `Brand vibe: ${brand}.\n` : '') +
    `Style: ${fix.creativeDirection || 'clean, modern, high-contrast, professional, photographic'}.\n` +
    `CRITICAL: NO text, NO words, NO letters, NO logos, NO watermark. Keep clear negative space near the TOP and the BOTTOM ` +
    `for a headline and a button to be added. A finished, premium photograph — not a mockup or template.`

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, modalities: ['image', 'text'], messages: [{ role: 'user', content: prompt }] }),
  })
  if (!res.ok) throw new Error(`image gen ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const j: any = await res.json()
  const dataUrl: string | undefined = j.choices?.[0]?.message?.images?.[0]?.image_url?.url
  if (!dataUrl?.startsWith('data:image')) throw new Error('no image returned from ' + MODEL)
  const visual = Buffer.from(dataUrl.split(',')[1], 'base64')

  // 2. composite the headline + CTA on top — perfect text, real layout.
  const meta = await sharp(visual).metadata()
  const W = meta.width || 1024, H = meta.height || 1024
  const out = await sharp(visual)
    .composite([{ input: Buffer.from(overlaySvg(W, H, fix)), top: 0, left: 0 }])
    .png()
    .toBuffer()

  const name = `${randomUUID()}.png`
  const dir = join(process.cwd(), 'public', 'fixes')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, name), out)
  return { imageUrl: `/fixes/${name}` }
}

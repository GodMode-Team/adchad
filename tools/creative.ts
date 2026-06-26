import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Nano Banana (Gemini 2.5 Flash Image) via OpenRouter — strong at in-image text + editing.
const MODEL = process.env.MODEL_IMAGE || 'google/gemini-2.5-flash-image'

type Fix = { headline: string; body?: string | null; cta?: string | null; creativeDirection?: string | null }

/** Fix an ad by EDITING the business's original (keeps their logo + brand look); the model renders the new copy in-style. */
export async function generate(fix: Fix, original: string, brand?: string | null): Promise<{ imageUrl: string }> {
  if (!original) throw new Error('creative: --original (the ad image to fix) is required')

  const instruction =
    `This is ${brand || 'a small business'}’s current Meta ad. KEEP their logo and brand identity — same logo, name, colors, and overall look. ` +
    `Redesign it into a stronger, scroll-stopping SINGLE static ad:\n` +
    `• Headline: "${fix.headline}"\n` +
    (fix.body ? `• Support / offer line: "${fix.body}"\n` : '') +
    (fix.cta ? `• A clear rounded CTA button: "${fix.cta}"\n` : '') +
    (fix.creativeDirection ? `• Direction: ${fix.creativeDirection}\n` : '') +
    `Render all text legibly and high-contrast, sharpen the hook and layout, keep it premium and on-brand. ` +
    `Output ONE finished, ready-to-run ad image — and preserve the original brand logo.`

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      modalities: ['image', 'text'],
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: instruction },
          { type: 'image_url', image_url: { url: original } }, // the ad to edit — keeps logo + brand
        ],
      }],
    }),
  })
  if (!res.ok) throw new Error(`image edit ${res.status}: ${(await res.text()).slice(0, 200)}`)

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

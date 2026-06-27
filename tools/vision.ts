// See the ad. Foreplay's `copy` field is the caption (often null for DCO ads) — the real copy is IN the image,
// so we audit the creative with a vision model. Roasts MUST be grounded in what's actually visible.
import { readFileSync, existsSync } from 'node:fs'

const MODEL = process.env.MODEL_VISION || 'google/gemini-2.5-flash'

const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' }

/** A URL passes through; a LOCAL file (e.g. a Slack attachment in the image cache) becomes a data: URL
 *  the vision API can read — so the agent never has to base64/ls/file-fumble an attachment again. */
export function toImageUrl(image: string): string {
  if (/^(https?:|data:)/i.test(image)) return image
  if (!existsSync(image)) throw new Error(`vision: image not found: ${image}`)
  const ext = image.split('.').pop()?.toLowerCase() ?? ''
  return `data:${MIME[ext] ?? 'image/png'};base64,${readFileSync(image).toString('base64')}`
}

export type AdLook = {
  headline: string | null
  body: string | null
  offer: string | null
  cta: string | null
  social_proof: string | null
  visual: string | null
  real_flaws: string[]
}

/** Look at an ad image and report ONLY what's actually visible (text, social proof, real flaws). */
export async function describe(imageUrl: string): Promise<AdLook> {
  if (!imageUrl) throw new Error('vision: --image (the ad creative URL) is required')
  const prompt =
    `You are auditing a Meta ad IMAGE. Report ONLY what is actually visible — never invent or assume. ` +
    `Read ALL on-image text. Return ONLY minified JSON: ` +
    `{"headline","body","offer","cta","social_proof","visual","real_flaws"}. ` +
    `social_proof = any visible star ratings, reviews, testimonials, or credibility claims (else null). ` +
    `real_flaws = an array of the 2-3 biggest GENUINE weaknesses of THIS specific ad (only true ones).`

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: toImageUrl(imageUrl) } }] }],
      response_format: { type: 'json_object' },
    }),
  })
  if (!res.ok) throw new Error(`vision ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const j: any = await res.json()
  const txt: string = j.choices?.[0]?.message?.content ?? '{}'
  const m = txt.match(/\{[\s\S]*\}/)
  return JSON.parse(m ? m[0] : '{}')
}

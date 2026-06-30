// See the ad. Foreplay's `copy` field is the caption (often null for DCO ads) — the real copy is IN the image,
// so we audit the creative with a vision model. Roasts MUST be grounded in what's actually visible.
import { readFileSync, existsSync } from 'node:fs'
import { costUsdOf } from './cost'

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

/** Pull the FIRST complete JSON object out of a model reply that may wrap it in ```fences``` or trailing
 *  prose. Scans brace depth (ignoring braces inside strings) so it never over-grabs like a greedy regex. */
export function parseJsonObject(txt: string): any {
  try { return JSON.parse(txt) } catch {} // clean case (response_format: json_object)
  const start = txt.indexOf('{')
  if (start < 0) return {}
  let depth = 0, inStr = false, esc = false
  for (let i = start; i < txt.length; i++) {
    const c = txt[i]
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false }
    else if (c === '"') inStr = true
    else if (c === '{') depth++
    else if (c === '}' && --depth === 0) return JSON.parse(txt.slice(start, i + 1))
  }
  return {}
}

export type AdLook = {
  headline: string | null
  body: string | null
  offer: string | null
  cta: string | null
  social_proof: string | null
  visual: string | null
  real_flaws: string[]
  score: number   // 0–100 creative quality, lower = worse
  verdict: string // one brutal line
  costUsd?: number // real USD cost of this vision call (OpenRouter usage.cost) — for P&L
}

// the team's catch: a VIDEO ad's burned-in caption ("The IRS") got read as text PRINTED ON the guy's shirt, so the
// roast mocked a "2012 template" shirt that never existed. The caption rule below keeps captions read AS captions.
export const VISION_PROMPT =
  `You are auditing a Meta ad IMAGE. Report ONLY what is actually visible — never invent or assume. ` +
  `Read ALL on-image text. ` +
  `If the ad is a VIDEO (e.g. a play button is visible), any text burned into the frame is a CAPTION/SUBTITLE overlay — ` +
  `read it as caption text, do NOT describe it as printed on a person's clothing/shirt, a sign, or any object, and do NOT roast it as a deliberate design choice. ` +
  `Return ONLY minified JSON: ` +
  `{"headline","body","offer","cta","social_proof","visual","real_flaws","score","verdict"}. ` +
  `social_proof = any visible star ratings, reviews, testimonials, or credibility claims (else null). ` +
  `real_flaws = an array of the 2-3 biggest GENUINE weaknesses of THIS specific ad (only true ones). ` +
  `score = an INTEGER 0-100 for THIS ad's creative quality, judged by a RUTHLESS world-class ad critic. Most small-business ads are weak, so BE HARSH and grade on a tight curve — default to skepticism, and when unsure score LOW. Anchors: stock-photo / vague hook / dead CTA / generic / stale / cluttered = 8-25; forgettable-but-functional = 30-45; only a genuinely sharp ad (specific hook + real proof + ONE clear CTA + strong visual) earns 60+; reserve 85+ for ads you'd put in a case study. A "fine" ad is still a 35, not a 65. ` +
  `verdict = one short brutal line (≤12 words) on why it scored that.`

/** Look at an ad image and report ONLY what's actually visible (text, social proof, real flaws). */
export async function describe(imageUrl: string): Promise<AdLook> {
  if (!imageUrl) throw new Error('vision: --image (the ad creative URL) is required')
  const prompt = VISION_PROMPT

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: toImageUrl(imageUrl) } }] }],
      response_format: { type: 'json_object' },
      usage: { include: true }, // return the real USD cost so the P&L is exact, not estimated
    }),
  })
  if (!res.ok) throw new Error(`vision ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const j: any = await res.json()
  const txt: string = j.choices?.[0]?.message?.content ?? '{}'
  const look = parseJsonObject(txt) as AdLook
  look.costUsd = costUsdOf(j)
  // normalize the two scored fields so callers can rely on them
  const n = Number((look as any).score)
  look.score = Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 30
  look.verdict = String(look.verdict || look.real_flaws?.[0] || 'weak, generic ad').slice(0, 120)
  if (!Array.isArray(look.real_flaws)) look.real_flaws = []
  return look
}

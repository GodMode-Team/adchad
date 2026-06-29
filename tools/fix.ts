import { describe } from './vision'
import { generate } from './creative'

// Fix copy is written by a strong model from the ad's REAL flaws; the image is gpt-image-2 (in tools/creative).
const MODEL = process.env.MODEL_COPY || 'x-ai/grok-4.3'

export type FixResult = { imageUrl: string; imageUrls: string[]; headline: string; body: string; cta: string; fixed: string[] }

// Meta's CTA button is a FIXED dropdown — you pick a label, you can't restyle it. The fix's `cta` must be one of these.
const META_CTAS = 'Book Now, Call Now, Contact Us, Learn More, Sign Up, Shop Now, Get Quote, Apply Now, Get Offer, Subscribe, Download, Send Message, Get Started'

/** Fix an ad: SEE its flaws (vision) → write copy that repairs each → generate the finished, ready-to-run image(s). */
export async function fix(opts: { image: string; brand?: string | null; roast?: string | null; variants?: number }): Promise<FixResult> {
  if (!opts.image) throw new Error('fix: --image (the ad to fix) is required')
  const brand = opts.brand || 'this business'

  // 1. SEE the ad
  const look = await describe(opts.image)

  // 2. write copy that REPAIRS exactly what the roast called out (never reintroduce what it mocked)
  const prompt =
    `You are a top media buyer fixing a weak Meta ad for ${brand}.\n` +
    `The current ad shows — headline: "${look.headline ?? '—'}", body: "${look.body ?? '—'}", offer: "${look.offer ?? '—'}", ` +
    `CTA: "${look.cta ?? 'none'}", social proof: "${look.social_proof ?? 'none'}".\n` +
    (opts.roast
      ? `AdChad publicly ROASTED this exact ad:\n"${opts.roast}"\n\nYour fixed ad MUST repair every criticism in that roast — and CRITICALLY must NOT reintroduce anything it mocked. If the roast ridiculed a "pretty headshot and generic stars," the fix CANNOT be a glamour model headshot with a star rating — it must LEAD with real before/after proof / a transformation, and a specific benefit-driven headline. Do NOT reuse the original's weak headline.\n`
      : `Its real flaws: ${(look.real_flaws ?? []).join('; ') || 'generic, weak hook'}. Repair each — add a clear CTA, add proof/results, surface the offer, kill generic-template vibes, sharpen the hook.\n`) +
    `"cta" MUST be one of Meta's fixed CTA button labels (${META_CTAS}) — pick the single best fit for the offer; Meta renders the button, so never invent a custom one or critique its look.\n` +
    `Return ONLY minified JSON {"headline","body","cta","direction"} — "direction" MUST describe a visual that avoids whatever the roast mocked (e.g. a real before/after transformation, NOT a stock glamour headshot, NOT a star-rating graphic).`

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } }),
  })
  if (!res.ok) throw new Error(`fix copy ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const j: any = await res.json()
  const out: string = (j.choices?.[0]?.message?.content ?? '{}').replace(/<think>[\s\S]*?<\/think>/g, '')
  const copy = JSON.parse((out.match(/\{[\s\S]*\}/) || ['{}'])[0])
  const headline = String(copy.headline ?? '').trim()
  if (!headline) throw new Error('fix: model returned no headline')
  const body = copy.body ? String(copy.body).trim() : null
  const cta = copy.cta ? String(copy.cta).trim() : null

  // 3. generate the finished creative(s): 1 for the $5 fix, 3 distinct angles for the $12 A/B pack (same copy)
  const n = Math.min(Math.max(1, opts.variants ?? 1), 3) // ponytail: A/B pack is 3; cap here, widen if a bigger pack ships
  const ANGLES = ['a bold real-life lifestyle photograph', 'a clean high-end studio product shot', 'a data-driven before/after infographic']
  const baseDir = copy.direction ? String(copy.direction).trim() : ''
  const dirs = n === 1
    ? [baseDir || null]
    : ANGLES.slice(0, n).map((a) => `${baseDir ? baseDir + '. ' : ''}Render this variant as ${a}.`)
  const imageUrls = (await Promise.all(dirs.map((d) => generate({ headline, body, cta, creativeDirection: d }, brand)))).map((g) => g.imageUrl)
  return { imageUrl: imageUrls[0], imageUrls, headline, body: body ?? '', cta: cta ?? '', fixed: look.real_flaws ?? [] }
}

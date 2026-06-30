import { describe, type AdLook } from './vision'
import { generate } from './creative'
import { costUsdOf } from './cost'

// Fix copy is written by a strong model from the ad's REAL flaws; the image is gpt-image-2 (in tools/creative).
const MODEL = process.env.MODEL_COPY || 'x-ai/grok-4.3'

export type FixVariant = { angle: string; headline: string; body: string; cta: string; imageUrl: string }
export type FixResult = { imageUrl: string; imageUrls: string[]; headline: string; body: string; cta: string; variants?: FixVariant[]; fixed: string[]; cost: number }
export type FixAngle = { key: string; brief: string }

// Meta's CTA button is a FIXED dropdown — you pick a label, you can't restyle it. The fix's `cta` must be one of these.
const META_CTAS = 'Book Now, Call Now, Contact Us, Learn More, Sign Up, Shop Now, Get Quote, Apply Now, Get Offer, Subscribe, Download, Send Message, Get Started'

// MESSAGE angles for the $12 A/B pack — different REASONS to click, not three looks of one message. From the
// marketingskills ad-creative angle framework; each pack variant is written from one angle (its own copy + image).
export const FIX_ANGLES: FixAngle[] = [
  { key: 'pain', brief: 'PAIN — hammer the specific pain or cost the prospect feels right now; make the cost of inaction sting.' },
  { key: 'outcome', brief: 'OUTCOME — paint the concrete after-state they want, vividly and specifically (the dream result).' },
  { key: 'proof', brief: 'SOCIAL PROOF — lead with a credible result, number, or who-already-trusts-you; proof-first.' },
  { key: 'curiosity', brief: 'CURIOSITY — open an intriguing gap or counter-intuitive insight that demands the click.' },
  { key: 'contrarian', brief: 'CONTRARIAN — call out why the common approach fails and position this as the smarter fix.' },
]

/** The copy-repair prompt (pure, testable). Repairs every roast criticism without reintroducing what it mocked,
 *  and steers the visual `direction` AWAY from the overused before/after split toward one simple, clean idea. */
export function buildFixCopyPrompt(look: AdLook, brand: string, roast?: string | null, angle?: FixAngle | null): string {
  return (
    `You are a top media buyer fixing a weak Meta ad for ${brand}.\n` +
    `The current ad shows — headline: "${look.headline ?? '—'}", body: "${look.body ?? '—'}", offer: "${look.offer ?? '—'}", ` +
    `CTA: "${look.cta ?? 'none'}", social proof: "${look.social_proof ?? 'none'}".\n` +
    (roast
      ? `AdChad publicly ROASTED this exact ad:\n"${roast}"\n\nYour fixed ad MUST repair every criticism in that roast — and CRITICALLY must NOT reintroduce anything it mocked. If the roast ridiculed a "pretty headshot and generic stars," the fix CANNOT be a glamour model headshot with a star rating — it must LEAD with a specific, benefit-driven headline and one strong piece of proof. Do NOT reuse the original's weak headline.\n`
      : `Its real flaws: ${(look.real_flaws ?? []).join('; ') || 'generic, weak hook'}. Repair each — add a clear CTA, add proof/results, surface the offer, kill generic-template vibes, sharpen the hook.\n`) +
    (angle ? `WRITE THIS VARIANT FROM ONE ANGLE — ${angle.brief}\n` : '') +
    `What a GREAT ad looks like — hit every one (distilled from brand/taste/ADCHAD-TASTE-PACK.md + the marketingskills ad-creative/copywriting skills):\n` +
    `• ONE big idea: a single specific promise or outcome, never a feature list. Reach for a proven headline shape — "{outcome} without {pain}", "Never {bad thing} again", "The {category} for {audience}", or a sharp pain-point question.\n` +
    `• Specific beats vague — numbers and real outcomes ("Cut your IRS bill from $47k to $9k"), never "save on taxes" or "more accessible". Lead with the prospect's real pain or desire.\n` +
    `• PROOF over claims: one concrete number, result, or detail beats "trusted by thousands" — and be HONEST, never fabricate a stat.\n` +
    `• Plain & active: simple words ("use" not "utilize"), active voice, confident (cut "almost/very/really"), NO exclamation points. Ban empty filler — "Best/Leading/Top", "streamline/optimize/innovative/seamless/elevate/unlock/empower/accessible/solutions". If a line could run unchanged for any competitor, rewrite it sharper.\n` +
    `• Fit Meta's fields: front-load the hook in the FIRST ~125 characters of "body"; keep "headline" ≤40 characters and punchy.\n` +
    `"cta" MUST be one of Meta's fixed CTA button labels (${META_CTAS}) — pick the single best fit for the offer; Meta renders the button, so never invent a custom one or critique its look.\n` +
    `Return ONLY minified JSON {"headline","body","cta","direction"} — "direction" MUST describe ONE premium visual idea that PROVES the promise: a real, credible image (a genuine product/lifestyle shot, ONE bold hero stat, or a clean proof asset) with a single dominant focal point and breathing room — legible at thumbnail size, looking like a real ready-to-run ad, never generic SaaS-gradient slop or a stock "team at a laptop". NEVER use a before/after split or any side-by-side "before vs after" comparison — that overused pattern is a BANNED one-trick pony. ALWAYS pick a single strong image instead (a real lifestyle/product shot, one bold hero stat, a clean diagram). Keep it uncluttered — one clear idea, never a busy multi-panel dashboard.`
  )
}

/** Write the fixed copy + creative direction for ONE variant (optionally from a specific message angle). */
async function writeCopy(look: AdLook, brand: string, roast: string | null | undefined, angle: FixAngle | null): Promise<{ headline: string; body: string | null; cta: string | null; direction: string | null; costUsd: number }> {
  const prompt = buildFixCopyPrompt(look, brand, roast, angle)
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' }, usage: { include: true } }),
  })
  if (!res.ok) throw new Error(`fix copy ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const j: any = await res.json()
  const out: string = (j.choices?.[0]?.message?.content ?? '{}').replace(/<think>[\s\S]*?<\/think>/g, '')
  const copy = JSON.parse((out.match(/\{[\s\S]*\}/) || ['{}'])[0])
  const headline = String(copy.headline ?? '').trim()
  if (!headline) throw new Error('fix: model returned no headline')
  return {
    headline,
    body: copy.body ? String(copy.body).trim() : null,
    cta: copy.cta ? String(copy.cta).trim() : null,
    direction: copy.direction ? String(copy.direction).trim() : null,
    costUsd: costUsdOf(j),
  }
}

/** Fix an ad: SEE its flaws (vision) → for the $5 fix, one strong creative (best angle); for the $12 A/B pack, one
 *  creative PER message angle — each with its OWN copy — so the pack tests different angles, not three looks. */
export async function fix(opts: { image: string; brand?: string | null; roast?: string | null; variants?: number }): Promise<FixResult> {
  if (!opts.image) throw new Error('fix: --image (the ad to fix) is required')
  const brand = opts.brand || 'this business'

  // 1. SEE the ad
  const look = await describe(opts.image)

  // 2. + 3. one variant for the $5 fix (no forced angle), one PER message angle for the $12 pack — each its own copy + image
  const n = Math.min(Math.max(1, opts.variants ?? 1), FIX_ANGLES.length)
  const angles: (FixAngle | null)[] = n === 1 ? [null] : FIX_ANGLES.slice(0, n)
  const built = await Promise.all(angles.map(async (angle) => {
    const c = await writeCopy(look, brand, opts.roast, angle)
    const g = await generate({ headline: c.headline, body: c.body, cta: c.cta, creativeDirection: c.direction }, brand)
    return { variant: { angle: angle?.key ?? 'primary', headline: c.headline, body: c.body ?? '', cta: c.cta ?? '', imageUrl: g.imageUrl }, cost: c.costUsd + g.costUsd }
  }))

  const variants: FixVariant[] = built.map((b) => b.variant)
  const primary = variants[0]
  // real cost = vision + every copy call + every image generated
  const cost = (look.costUsd ?? 0) + built.reduce((s, b) => s + b.cost, 0)
  return { imageUrl: primary.imageUrl, imageUrls: variants.map((v) => v.imageUrl), headline: primary.headline, body: primary.body, cta: primary.cta, variants, fixed: look.real_flaws ?? [], cost }
}

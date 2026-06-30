import { describe, type AdLook } from './vision'
import { generate } from './creative'
import { costUsdOf } from './cost'
import type { FbMockSpec } from './render/fb-mock'

// Fix copy is written by a strong model on a grounded rubric; the creative is rendered DETERMINISTICALLY as a
// finished Meta-feed mockup (tools/render/fb-mock) — the model never draws the text, so it can't be slop.
const MODEL = process.env.MODEL_COPY || 'x-ai/grok-4.3'

type CreativeSpec = FbMockSpec['creative']
export type FixVariant = { angle: string; headline: string; body: string; cta: string; imageUrl: string; creativeUrl: string }
export type FixResult = { imageUrl: string; imageUrls: string[]; creativeUrls: string[]; headline: string; body: string; cta: string; variants?: FixVariant[]; fixed: string[]; cost: number }
export type FixAngle = { key: string; brief: string }

// Meta's CTA button is a FIXED dropdown — you pick a label, you can't restyle it. The fix's `cta` must be one of these.
const META_CTAS = 'Book Now, Call Now, Contact Us, Learn More, Sign Up, Shop Now, Get Quote, Apply Now, Get Offer, Subscribe, Download, Send Message, Get Started'
const ACCENTS = 'warm (food/restaurant/cozy), cool (saas/tech/finance/B2B), fresh (health/wellness/beauty/clean), lime (bold/energetic/youth), bold (default — dark, premium, high-contrast)'

// MESSAGE angles for the $12 A/B pack — different REASONS to click, not three looks of one message. From the
// marketingskills ad-creative angle framework; each pack variant is written from one angle (its own copy + image).
export const FIX_ANGLES: FixAngle[] = [
  { key: 'pain', brief: 'PAIN — hammer the specific pain or cost the prospect feels right now; make the cost of inaction sting.' },
  { key: 'outcome', brief: 'OUTCOME — paint the concrete after-state they want, vividly and specifically (the dream result).' },
  { key: 'proof', brief: 'SOCIAL PROOF — lead with a credible result, number, or who-already-trusts-you; proof-first.' },
  { key: 'curiosity', brief: 'CURIOSITY — open an intriguing gap or counter-intuitive insight that demands the click.' },
  { key: 'contrarian', brief: 'CONTRARIAN — call out why the common approach fails and position this as the smarter fix.' },
]

/** The copy-repair prompt (pure, testable). Repairs every roast criticism without reintroducing what it mocked, and
 *  emits a STRUCTURED creative spec the deterministic renderer turns into one clean focal graphic (no before/after). */
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
    `• PROOF over claims: one concrete number, result, or detail beats "trusted by thousands" — and be HONEST, never fabricate a stat. If you have no real number, keep proof safely generic ("hundreds of locals", "4.9 stars").\n` +
    `• Plain & active: simple words ("use" not "utilize"), active voice, confident (cut "almost/very/really"), NO exclamation points, NO em-dashes. Ban empty filler — "Best/Leading/Top", "streamline/optimize/innovative/seamless/elevate/unlock/empower/accessible/solutions". If a line could run unchanged for any competitor, rewrite it sharper.\n` +
    `• Fit Meta's fields: front-load the hook in the FIRST ~125 characters of "body"; keep "headline" ≤40 characters and punchy. "body" is 2-4 short lines (hook → why → one proof → offer → light urgency), not one line and not a wall.\n` +
    `"cta" MUST be one of Meta's fixed CTA button labels (${META_CTAS}) — pick the single best fit for the offer; Meta renders the button, so never invent a custom one or critique its look.\n` +
    `The CREATIVE is rendered DETERMINISTICALLY from a STRUCTURED spec (you do NOT write a prose image brief). Give ONE clean focal idea — NEVER a before/after split or any side-by-side comparison (a BANNED one-trick pony), and never a busy multi-panel dashboard. Keep it simple and uncluttered.\n` +
    `Return ONLY minified JSON: {"headline","body","cta","creative":{"kicker","hero","hero2","subline","offer","offerLabel","urgency","accent"}}.\n` +
    `creative.kicker = a short ALL-CAPS eyebrow (context/credibility, ≤6 words, else ""). creative.hero = the giant focal line: 1-2 SHORT words OR a number. creative.hero2 = optional 2nd big line (else ""). creative.subline = a short descriptor (else ""). creative.offer = a short offer value e.g. "$50 OFF" / "2 / 145 LE" (else ""). creative.offerLabel = a short qualifier e.g. "NEW CLIENTS" (else ""). creative.urgency = a short ribbon e.g. "TODAY ONLY" (else ""). creative.accent = the palette that fits the vertical: ${ACCENTS}.\n` +
    `BAD → GOOD: BAD headline "Double Livers + Rolls: 145" is a menu line, no hook. GOOD headline "The Double Kebda Everyone's Posting" with creative {kicker:"FIRE-GRILLED · FRESH DAILY", hero:"DOUBLE", hero2:"KEBDA", subline:"charred livers · soft rolls", offer:"2 / 145 LE", offerLabel:"DINE-IN OR DELIVERY", urgency:"TODAY ONLY", accent:"warm"}.\n` +
    `SELF-CRITIQUE before answering (silently): could a competitor run this exact headline? does it echo the original's weak line? is it a menu/category dump? does the reader have to infer the value? does it read like AI? If YES to any — rewrite until every answer is NO.`
  )
}

const s = (v: any) => (v == null || v === '' ? null : String(v).trim())
function normalizeCreative(c: any, headline: string): CreativeSpec {
  const accent = ['warm', 'cool', 'fresh', 'lime', 'bold'].includes(c?.accent) ? c.accent : 'bold'
  return { kicker: s(c?.kicker), hero: s(c?.hero) || headline, hero2: s(c?.hero2), subline: s(c?.subline), offer: s(c?.offer), offerLabel: s(c?.offerLabel), urgency: s(c?.urgency), accent }
}

/** Write the fixed copy + structured creative spec for ONE variant (optionally from a specific message angle). */
async function writeCopy(look: AdLook, brand: string, roast: string | null | undefined, angle: FixAngle | null): Promise<{ headline: string; body: string; cta: string; creative: CreativeSpec; costUsd: number }> {
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
    body: (copy.body ? String(copy.body).trim() : '').replace(/\s*—\s*/g, ' '),
    cta: copy.cta ? String(copy.cta).trim() : 'Learn More',
    creative: normalizeCreative(copy.creative, headline),
    costUsd: costUsdOf(j),
  }
}

/** Fix an ad: SEE its flaws (vision) → for the $5 fix, one strong creative (best angle); for the $12 A/B pack, one
 *  creative PER message angle — each with its OWN copy. Each variant renders a finished Meta MOCKUP + a bare
 *  1080² uploadable creative. The model never draws the copy → no slop. */
export async function fix(opts: { image: string; brand?: string | null; roast?: string | null; variants?: number }): Promise<FixResult> {
  if (!opts.image) throw new Error('fix: --image (the ad to fix) is required')
  const brand = opts.brand || 'this business'

  // 1. SEE the ad
  const look = await describe(opts.image)
  const was = look.headline ? String(look.headline).trim().slice(0, 60) : null

  // 2. + 3. one variant for the $5 fix (no forced angle), one PER message angle for the $12 pack — each its own copy + creative
  const n = Math.min(Math.max(1, opts.variants ?? 1), FIX_ANGLES.length)
  const angles: (FixAngle | null)[] = n === 1 ? [null] : FIX_ANGLES.slice(0, n)
  const built = await Promise.all(angles.map(async (angle) => {
    const c = await writeCopy(look, brand, opts.roast, angle)
    const spec: FbMockSpec = { brand, headline: c.headline, body: c.body, cta: c.cta, was, creative: c.creative }
    const g = await generate(spec) // renders BOTH the FB mockup + the bare uploadable creative
    return { variant: { angle: angle?.key ?? 'primary', headline: c.headline, body: c.body, cta: c.cta, imageUrl: g.imageUrl, creativeUrl: g.creativeUrl }, cost: c.costUsd + g.costUsd }
  }))

  const variants: FixVariant[] = built.map((b) => b.variant)
  const primary = variants[0]
  // real cost = vision + every copy call (creative render is ~free; no image API)
  const cost = (look.costUsd ?? 0) + built.reduce((sum, b) => sum + b.cost, 0)
  return {
    imageUrl: primary.imageUrl, imageUrls: variants.map((v) => v.imageUrl), creativeUrls: variants.map((v) => v.creativeUrl),
    headline: primary.headline, body: primary.body, cta: primary.cta, variants, fixed: look.real_flaws ?? [], cost,
  }
}

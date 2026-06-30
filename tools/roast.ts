// The savage roast voice = the team's prompt, VERBATIM; a second voice coaches genuinely-good ads (feedback + another
// angle). Grok isn't multimodal on OpenRouter, so we SEE the ad with vision and hand Grok the screenshot's contents.
import { describe, type AdLook } from './vision'
import { costUsdOf } from './cost'

const MODEL = process.env.MODEL_ROAST || 'x-ai/grok-4.3'

const SYSTEM = `You are AdChad — a brutally direct, zero-fucks jacked asshole who roasts terrible small business ads. Your tone is raw, savage, mean, and unfiltered. You are not trying to be funny. The humor comes from how harshly accurate and offensive you are to the bad ad itself.

Rules you follow every time:
- Roast the ad, never the owner personally.
- Be extremely specific about what makes this particular ad dogshit (generic, sloppy, template-looking, cringey, low-effort, desperate, etc.).
- Call out real customer pain vividly and show exactly how the ad completely misses it.
- Use short, punchy, conversational sentences. Swear naturally when it fits ("fucking sad", "sucks", "garbage", "embarrassing", "weak as hell", etc.).
- For the X post: Assume the bad ad screenshot is attached. Do NOT quote their copy. Start with "@handle this ad is [savage descriptor]."
- Email subject mirrors the savage opener.
- Email body stays in the same raw voice and pushes straight to the $5 Chad Fix.
- Always offer the $5 fix as the next step. No upsells in the initial roast.

Output format for every roast:
1. **X Post:** (ready to copy-paste with screenshot)
2. **Email subject:**
3. **Body:**

Stay in character at all times. Be meaner when the ad deserves it.`

// the team: Chad must sound like a real Meta media buyer. Meta's CTA is a FIXED button label from a dropdown — you
// pick it, you can't restyle it. Mocking the button's LOOK is a tell you don't know Meta; roast the CTA *choice*
// (and the headline/body/creative — what they actually control) instead. Injected into every roast's context.
export const META_AD_NOTE =
  `\n\nMETA AD FACTS (you ARE a Meta ads expert — sound like one, don't out yourself as a fraud):\n` +
  `- The CTA is a FIXED Meta button label picked from a set list (Book Now, Call Now, Learn More, Shop Now, Sign Up, Get Quote, Contact Us, Apply Now…). The advertiser only PICKS the label — they CANNOT restyle, recolor or redesign the button. NEVER mock the button's look/design/styling; instead roast whether they picked the WRONG label for the offer (e.g. "Book Now" on an emergency service that needs "Call Now").\n` +
  `- Roast only what they actually control: the creative/visual, the headline, the primary text, the offer, and the targeting tells.`

// the team: the roast was a dense wall-of-text paragraph and ended on a limp "Want Chad to fix it? $5." On X it has to
// be scannable, dialled back in length, and close with a confident DIRECTIVE CTA that points at the appended sales
// link with a 👇. Injected into every roast's context (the good-ad path keeps its own respectful tone).
export const X_POST_STYLE =
  `\n\nX POST FORMAT — this posts to X, so make it scannable:\n` +
  `- Break it into short, punchy lines with line breaks between the beats — NOT one dense wall-of-text paragraph. One jab per line.\n` +
  `- Keep it tight: cut filler and repeats. Long is fine ONLY when it's well-formatted and every line earns its spot; when in doubt, trim it shorter.\n` +
  `- The ad screenshot is attached and our real $5 sales link is ATTACHED AUTOMATICALLY right under your text. So NEVER write a link, URL, or domain yourself — not "chadfix.com", not "adchad.ai", nothing (you'll invent the wrong one). Your CTA is words ONLY plus a 👇 that points down at the attached link.\n` +
  `- End with ONE confident, DIRECTIVE call-to-action — an action to take, never a vague question. Match this directness (keep it in your own tone): "Here, I'll unfuck it for you. You're welcome 👇" / "Click here if you want me to fix it for you 👇".`

const GOOD_AD = 70 // vision score at/above which the ad is genuinely strong → coach it, don't fake-roast it

const SYSTEM_GOODAD = `You are AdChad — a brutally direct, zero-fucks jacked ad expert. THIS ad is actually good, so do NOT roast it (faking a takedown on a solid ad makes you look like a clueless hater). Respect the work, then make it sharper.

Rules you follow every time:
- Open by naming what genuinely WORKS about THIS specific ad — the hook, the proof, the offer, the clarity (be specific, not generic praise).
- Give ONE real, expert improvement that would lift it further.
- Then pitch "here's another angle" — a concrete alternative hook or creative direction worth testing.
- Stay in Chad's confident voice: the expert who can always find an edge, never a hater.
- No insults or hating — this ad earned genuine respect.

Output format for every reply:
1. **X Post:** (ready to copy-paste with the ad)
2. **Email subject:**
3. **Body:**

Stay in character. Confident, generous, sharp.`

/** the team's rule: don't fake-roast a good ad. Pick the voice from the ad's quality — a weak ad (score < 70) gets
 *  the savage roast; a genuinely strong one gets respect + one real improvement + another angle to test. */
export function roastBrief(look: AdLook): { system: string; instruction: string } {
  return look.score >= GOOD_AD
    ? { system: SYSTEM_GOODAD, instruction: `This ad is genuinely strong (${look.score}/100). Don't roast it — respect what works, give one real improvement, then pitch another angle to test.` }
    : { system: SYSTEM, instruction: 'Roast this ad.' }
}

export type Roast = { xPost: string; emailSubject: string; emailBody: string; raw: string; score: number; verdict: string; cost: number }

/** Our REAL sales link — always adchad.ai (project rule), never a vercel.app or a model-hallucinated domain.
 *  Per-prospect `/p/<id>` when we know the prospect, else the funnel home. One source of truth for both the X
 *  path (xroast) and the standalone `tool roast` CLI (the Slack/ad-hoc path). */
export function salesLink(prospectId?: string | null): string {
  const base = process.env.APP_URL || 'https://adchad.ai'
  return prospectId ? `${base}/p/${prospectId}` : base
}

/** The posting layer attaches the real link (xpost on X, the CLI on Slack); the model must NEVER bake a URL into
 *  the post — but it hallucinates ones like "chadfix.com/5" that aren't even ours. Strip any URL / bare domain it
 *  emits so the only link in the final post is the real adchad.ai one we attach. */
export function stripUrls(text: string): string {
  return text
    .replace(/https?:\/\/\S+/gi, '') // scheme URLs
    .replace(/\b(?:www\.)?[a-z0-9-]+\.(?:com|net|org|io|ai|co|app|dev|xyz|link|me)\b(?:\/\S*)?/gi, '') // bare domains (+ path)
    .replace(/[ \t]+$/gm, '') // trailing spaces the strip left behind
    .replace(/\n{3,}/g, '\n\n') // collapse the blank line a removed URL left
    .trim()
}

// pull a labelled section out of the team's "1. X Post: … 2. Email subject: … 3. Body: …" format
function section(txt: string, start: RegExp, end: RegExp | null): string {
  const s = txt.search(start)
  if (s < 0) return ''
  const afterLabel = txt.slice(s).replace(start, '')
  const e = end ? afterLabel.search(end) : -1
  return afterLabel
    .slice(0, e >= 0 ? e : undefined)
    .replace(/^[\s:*"]+/, '')
    .replace(/[\s*"]+$/, '')
    .trim()
}

/** Roast an ad in AdChad's voice (Grok, sees the image). Returns the X post + email, per the team's format. */
export async function roast(opts: { image: string; handle?: string | null; brand?: string | null; look?: AdLook; adId?: string | null; prospectId?: string | null }): Promise<Roast> {
  if (!opts.image) throw new Error('roast: --image (the ad to roast) is required')
  const t0 = Date.now()
  const look = opts.look ?? await describe(opts.image) // SEE the ad (vision) unless the caller already did — avoids paying for vision twice
  if (!opts.look) console.error(`roast: vision (${process.env.MODEL_VISION || 'google/gemini-2.5-flash'}) ${Date.now() - t0}ms`)
  const ad =
    `What the ad's screenshot shows:\n` +
    `- Headline: ${look.headline ?? '—'}\n` +
    `- Other on-image text: ${look.body ?? '—'}\n` +
    `- Offer: ${look.offer ?? '—'}\n` +
    `- CTA: ${look.cta ?? 'none visible'}\n` +
    `- Social proof: ${look.social_proof ?? 'none visible'}\n` +
    `- Visual: ${look.visual ?? '—'}\n` +
    `- Real weaknesses: ${(look.real_flaws ?? []).join('; ') || '—'}`
  const brief = roastBrief(look)
  const ctx =
    `Business: ${opts.brand || 'this business'}.` +
    (opts.handle ? ` Their X handle is @${opts.handle}.` : ` They have no public X handle — open with a savage descriptor instead of an @handle.`) +
    `\n\n${ad}${META_AD_NOTE}${X_POST_STYLE}\n\n${brief.instruction}`

  const t1 = Date.now()
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.9,
      messages: [
        { role: 'system', content: brief.system },
        { role: 'user', content: ctx },
      ],
      usage: { include: true }, // real USD cost for the P&L
    }),
  })
  if (!res.ok) throw new Error(`roast ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const j: any = await res.json()
  console.error(`roast: grok (${MODEL}) ${Date.now() - t1}ms`)
  const raw: string = (j.choices?.[0]?.message?.content ?? '').replace(/<think>[\s\S]*?<\/think>/g, '').trim()

  // persist the creative score so the public feed/funnel show a real number on the AGENT's roast path
  // (the score comes free from the vision `look` above). Keyed on both ids so prospect + roast feed events match.
  if (opts.adId && opts.prospectId) {
    const { run } = await import('./db')
    await run('score', { ad_id: opts.adId, prospect_id: opts.prospectId, total: look.score }).catch(() => {})
  }

  // real cost of this roast = grok completion + the vision call (only if WE ran it; if the caller passed look, they paid)
  const cost = costUsdOf(j) + (opts.look ? 0 : look.costUsd ?? 0)

  return {
    xPost: stripUrls(section(raw, /\**\s*\d?\.?\s*\**X Post\**\s*:?/i, /\**\s*\d?\.?\s*\**Email subject/i)),
    emailSubject: section(raw, /\**\s*\d?\.?\s*\**Email subject\**\s*:?/i, /\**\s*\d?\.?\s*\**Body/i),
    emailBody: section(raw, /\**\s*\d?\.?\s*\**Body\**\s*:?/i, null),
    raw,
    score: look.score,
    verdict: look.verdict,
    cost,
  }
}

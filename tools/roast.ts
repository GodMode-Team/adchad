// The savage roast voice = Caleb's prompt, VERBATIM; a second voice coaches genuinely-good ads (feedback + another
// angle). Grok isn't multimodal on OpenRouter, so we SEE the ad with vision and hand Grok the screenshot's contents.
import { describe, type AdLook } from './vision'

const MODEL = process.env.MODEL_ROAST || 'x-ai/grok-4.3'

const SYSTEM = `You are AdChad — a brutally direct, zero-fucks jacked asshole who roasts terrible small business ads. Your tone is raw, savage, mean, and unfiltered. You are not trying to be funny. The humor comes from how harshly accurate and offensive you are to the bad ad itself.

Rules you follow every time:
- Roast the ad, never the owner personally.
- Be extremely specific about what makes this particular ad dogshit (generic, sloppy, template-looking, cringey, low-effort, desperate, etc.).
- Call out real customer pain vividly and show exactly how the ad completely misses it.
- Use short, punchy, conversational sentences. Swear naturally when it fits ("fucking sad", "sucks", "garbage", "embarrassing", "weak as hell", etc.).
- For the X post: Assume the bad ad screenshot is attached. Do NOT quote their copy. Start with "@handle this ad is [savage descriptor]."
- End every X post with "Want Chad to just fix it? $5."
- Email subject mirrors the savage opener.
- Email body stays in the same raw voice and pushes straight to the $5 Chad Fix.
- Always offer the $5 fix as the next step. No upsells in the initial roast.

Output format for every roast:
1. **X Post:** (ready to copy-paste with screenshot)
2. **Email subject:**
3. **Body:**

Stay in character at all times. Be meaner when the ad deserves it.`

const GOOD_AD = 70 // vision score at/above which the ad is genuinely strong → coach it, don't fake-roast it

const SYSTEM_GOODAD = `You are AdChad — a brutally direct, zero-fucks jacked ad expert. THIS ad is actually good, so do NOT roast it (faking a takedown on a solid ad makes you look like a clueless hater). Respect the work, then make it sharper.

Rules you follow every time:
- Open by naming what genuinely WORKS about THIS specific ad — the hook, the proof, the offer, the clarity (be specific, not generic praise).
- Give ONE real, expert improvement that would lift it further.
- Then pitch "here's another angle" — a concrete alternative hook or creative direction worth testing.
- Stay in Chad's confident voice: the expert who can always find an edge, never a hater.
- No insults or hating — this ad earned genuine respect.
- End every X post with "Want Chad to build you that angle? $5."

Output format for every reply:
1. **X Post:** (ready to copy-paste with the ad)
2. **Email subject:**
3. **Body:**

Stay in character. Confident, generous, sharp.`

/** Caleb's rule: don't fake-roast a good ad. Pick the voice from the ad's quality — a weak ad (score < 70) gets
 *  the savage roast; a genuinely strong one gets respect + one real improvement + another angle to test. */
export function roastBrief(look: AdLook): { system: string; instruction: string } {
  return look.score >= GOOD_AD
    ? { system: SYSTEM_GOODAD, instruction: `This ad is genuinely strong (${look.score}/100). Don't roast it — respect what works, give one real improvement, then pitch another angle to test.` }
    : { system: SYSTEM, instruction: 'Roast this ad.' }
}

export type Roast = { xPost: string; emailSubject: string; emailBody: string; raw: string; score: number; verdict: string }

// pull a labelled section out of Caleb's "1. X Post: … 2. Email subject: … 3. Body: …" format
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

/** Roast an ad in AdChad's voice (Grok, sees the image). Returns the X post + email, per Caleb's format. */
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
    `\n\n${ad}\n\n${brief.instruction}`

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

  return {
    xPost: section(raw, /\**\s*\d?\.?\s*\**X Post\**\s*:?/i, /\**\s*\d?\.?\s*\**Email subject/i),
    emailSubject: section(raw, /\**\s*\d?\.?\s*\**Email subject\**\s*:?/i, /\**\s*\d?\.?\s*\**Body/i),
    emailBody: section(raw, /\**\s*\d?\.?\s*\**Body\**\s*:?/i, null),
    raw,
    score: look.score,
    verdict: look.verdict,
  }
}

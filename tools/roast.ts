// The roast voice = Caleb's prompt, VERBATIM. Nothing added. Grok isn't multimodal on OpenRouter, so we SEE the
// ad with the vision model and hand Grok the screenshot's contents — savage AND truthful, no extra rules.
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

export type Roast = { xPost: string; emailSubject: string; emailBody: string; raw: string }

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
export async function roast(opts: { image: string; handle?: string | null; brand?: string | null; look?: AdLook }): Promise<Roast> {
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
  const ctx =
    `Business: ${opts.brand || 'this business'}.` +
    (opts.handle ? ` Their X handle is @${opts.handle}.` : ` They have no public X handle — open with a savage descriptor instead of an @handle.`) +
    `\n\n${ad}\n\nRoast this ad.`

  const t1 = Date.now()
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.9,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: ctx },
      ],
    }),
  })
  if (!res.ok) throw new Error(`roast ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const j: any = await res.json()
  console.error(`roast: grok (${MODEL}) ${Date.now() - t1}ms`)
  const raw: string = (j.choices?.[0]?.message?.content ?? '').replace(/<think>[\s\S]*?<\/think>/g, '').trim()

  return {
    xPost: section(raw, /\**\s*\d?\.?\s*\**X Post\**\s*:?/i, /\**\s*\d?\.?\s*\**Email subject/i),
    emailSubject: section(raw, /\**\s*\d?\.?\s*\**Email subject\**\s*:?/i, /\**\s*\d?\.?\s*\**Body/i),
    emailBody: section(raw, /\**\s*\d?\.?\s*\**Body\**\s*:?/i, null),
    raw,
  }
}

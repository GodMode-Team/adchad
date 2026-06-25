import { completeJSON } from './model'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const roastSkill = readFileSync(join(process.cwd(), 'skills/roast/SKILL.md'), 'utf8')

type Ad = { advertiser?: string | null; copy?: string | null; niches?: string[] | null }

/** Generate the public roast (Hermes-4 via the roast skill). xpost/email handle delivery (Spec 04). */
export async function roast(
  prospect: { name?: string | null },
  ad: Ad,
  badnessReasons: string[] = [],
): Promise<{ text: string; hook: string }> {
  const adText =
    `Business: ${ad.advertiser ?? prospect.name}\n` +
    `Niche: ${(ad.niches || []).join(', ') || '(unknown)'}\n` +
    `Ad copy: ${ad.copy?.trim() || '(image-only ad — roast the visual/offer)'}\n` +
    `Known weaknesses: ${badnessReasons.join('; ') || '(use your judgment)'}`

  const r = await completeJSON<{ text: string; hook: string }>(
    roastSkill,
    `Roast this ad per the skill. "text" must be ≤ 230 characters (we append a link after it).\n${adText}\nJSON: {"text": string, "hook": string}`,
    { temperature: 0.8 },
  )
  return { text: (r.text ?? '').trim(), hook: (r.hook ?? '').trim() }
}

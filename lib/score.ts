import { sql } from './db'
import { completeJSON } from './model'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const synthcheck = readFileSync(join(process.cwd(), 'skills/synthcheck/SKILL.md'), 'utf8')

type Ad = { id?: string; advertiser?: string | null; copy?: string | null; niches?: string[] | null; running_duration?: number | null }
type Prospect = { id?: string; email?: string | null; email_source?: string | null; x_handle?: string | null; segment?: string | null }
export type Score = { badness: number; economic: number; reachSafety: number; total: number; gate: 'qualify' | 'held' | 'filter' }

const clamp = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)))

// ponytail: scoring runs on the confirmed Hermes-4 (default). Swap MODEL_SCORE→Nemotron for volume/cost later (P4).
export async function score(ad: Ad, prospect: Prospect): Promise<Score> {
  const adText = `Advertiser: ${ad.advertiser}\nNiche: ${(ad.niches || []).join(', ')}\nDays running: ${ad.running_duration ?? '?'}\nAd copy: ${ad.copy ?? '(none)'}`

  // badness (35%) — synthcheck methodology
  const b = await completeJSON<{ badness: number; reasons: string[] }>(
    `You are SynthCheck, scoring how WEAK a Meta ad's creative is (0 = great, 100 = terrible).\n${synthcheck}`,
    `Score this ad 0-100 for creative weakness and list the top reasons.\n${adText}\nJSON: {"badness": number, "reasons": string[]}`,
  )

  // economic / ICP fit (30%) — owner-led local SMB filter
  const e = await completeJSON<{ economic: number; reasons: string[] }>(
    `Score advertiser fit for AdChad's ICP: an OWNER-LED local SMB on Meta ads with a $300+ LTV offer who'd pay $49/mo for better creative. Marketplaces, lead-gen aggregators, national brands, and SaaS apps score LOW — they are not owner-led local SMBs.`,
    `Score economic/ICP fit 0-100.\n${adText}\nJSON: {"economic": number, "reasons": string[]}`,
  )

  // reachability (deterministic from enrichment): scraped > guessed > x-only > none
  const reach =
    prospect.segment === 'unreachable' ? 0
    : prospect.email_source === 'scraped' ? 100
    : prospect.email ? 60
    : prospect.x_handle ? 50 : 0

  // safety self-consistency vote — 3 independent calls; default unsafe on error
  const votes = await Promise.all(
    [0, 1, 2].map(() =>
      completeJSON<{ safe: boolean }>(
        `You guard brand-safety for a public ad-roasting bot. A roast must punch at the AD creative only — never protected classes, never a person's character, and avoid sensitive verticals (medical claims, addiction, financial hardship, religion, politics). Default to unsafe if unsure.`,
        `Is it FAIR and SAFE to publicly roast this ad?\n${adText}\nJSON: {"safe": boolean}`,
      ).then((v) => !!v.safe).catch(() => false),
    ),
  )
  const safe = votes.filter(Boolean).length >= 2
  const reachSafety = safe ? reach : Math.min(reach, 15) // unsafe → capped low so the gate filters it

  const badness = clamp(b.badness)
  const economic = clamp(e.economic)
  const total = Math.round(0.35 * badness + 0.3 * economic + 0.35 * reachSafety)
  const gate: Score['gate'] = total >= 85 ? 'qualify' : total < 70 ? 'filter' : 'held'

  await sql`
    insert into scores (ad_id, prospect_id, badness, economic, reach_safety, total, gate, votes)
    values (${ad.id ?? null}, ${prospect.id ?? null}, ${badness}, ${economic}, ${reachSafety}, ${total}, ${gate},
            ${sql.json({ badnessReasons: b.reasons, economicReasons: e.reasons, safeVotes: votes })})`

  return { badness, economic, reachSafety, total, gate }
}

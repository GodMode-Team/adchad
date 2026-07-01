import { sql } from '../lib/db'
import { mentions as realMentions, type Mention } from './xread'
import { xroast } from './xroast'

// spec-15 (@adchad summon): anyone can summon Chad by replying `@adchad` to an ad. We roast the ad PUBLICLY and drop the
// $5 fix link in-thread — ALWAYS a paid sell (no free comp; that stays exclusive to the launch thread, spec-14). Mirrors
// tools/launch.ts: a thin loop over a tweet source with claim-first dedup, a self-skip, and the kill-switch (control.paused)
// as the only valve. The ad to roast is the mention's own image (a screenshot) or the tweet it replies to/quotes (a live X
// ad) — adTweetOf decides which; xroast fetches+roasts it and replies under the MENTION. No ad found → one nudge.
// NOTE: xroast() now defaults to a FREE fix whenever the caller doesn't say and the launch campaign is armed (so
// autonomous /prospect roasts get it too) — mentionRoastArgs passes freeFix:false explicitly so a summon during an
// armed launch window still sells the $5 fix, never comps.
export type MentionDeps = {
  control: () => Promise<{ paused: boolean }>
  mentions: () => Promise<{ items: Mention[] }>
  roast: (args: { tweet: string; replyTo: string }) => Promise<{ prospectId: string }>
  nudge: (replyToId: string) => Promise<void>
  me: () => Promise<string>
}

export const NUDGE_TEXT =
  "Can't roast thin air. Drop the ad's screenshot, or reply to me right under the ad itself, and I'll unfuck it. 👇"

/** Always paid, never comped — see the NOTE above. */
export function mentionRoastArgs(tweet: string, replyTo: string): { tweet: string; replyTo: string; freeFix: false } {
  return { tweet, replyTo, freeFix: false }
}

const DEFAULT: MentionDeps = {
  control: async () => {
    const [c] = await sql<any[]>`select paused from control where id=1`
    return { paused: !!c?.paused }
  },
  mentions: realMentions,
  roast: ({ tweet, replyTo }) => xroast(mentionRoastArgs(tweet, replyTo)),
  nudge: async (replyToId) => {
    const { xpost } = await import('./xpost')
    await xpost({ text: NUDGE_TEXT, replyToTweetId: replyToId })
  },
  me: async () => process.env.X_HANDLE || 'adchadofficial', // our own handle — static; xpost.ts uses the same fallback
}

type RunResult = {
  reason?: 'paused'
  processed: string[]
  skipped: { id: string; reason: 'self' | 'dup' }[]
  errors: { id: string; error: string }[]
}

/** One mention beat: roast each fresh @adchad ad-summon (or nudge if there's no ad), replying in-thread with the $5 link.
 *  Idempotent (claim-first dedup on the mention id). Kill-switch (control.paused) is the only valve — no caps, like launch. */
export async function run(deps: Partial<MentionDeps> = {}): Promise<RunResult> {
  const d = { ...DEFAULT, ...deps }
  const out: RunResult = { processed: [], skipped: [], errors: [] }

  const { paused } = await d.control()
  if (paused) return { ...out, reason: 'paused' } // kill-switch — the only safety valve

  const me = (await d.me()).toLowerCase()
  const { items } = await d.mentions()

  for (const m of items) {
    try {
      // Guard 1: never roast our own @handle — our roast/fix replies carry images, which would self-roast forever.
      if ((m.handle ?? '').toLowerCase() === me) { out.skipped.push({ id: m.id, reason: 'self' }); continue }
      // Guard 2 (dedup): a 'mention' marker keyed on the INCOMING mention id (internal channel — invisible to the /live
      // feed). CLAIM IT BEFORE posting, so a crash between the public roast and here can never double-post. We also honor
      // the launch runner's claim: a launch-thread image-reply auto-tags @adchad, so it lands here too — if launch already
      // claimed it (engage runs launch BEFORE mention), skip, else the reply gets BOTH a free comp and a $5 roast.
      const [seen] = await sql<any[]>`select 1 from interactions where channel in ('launch','mention') and ref=${m.id} limit 1`
      if (seen) { out.skipped.push({ id: m.id, reason: 'dup' }); continue }
      await sql`insert into interactions (channel, direction, ref, text, handled) values ('mention', 'in', ${m.id}, 'mention claimed', true)`
      // ponytail: claim-first = at-most-once roast. A hard failure after the roast posts but before here leaves the mention
      // roasted-without-the-loop-closed (surfaced in errors[]) — preferred over a double public roast.

      if (!m.adTweetId) { await d.nudge(m.id); out.processed.push(m.id); continue } // nothing to roast → one nudge
      try {
        // xroast: fetch the ad's image+author (from adTweetId), roast → public reply UNDER the mention → append the $5 link.
        await d.roast({ tweet: m.adTweetId, replyTo: m.id })
        out.processed.push(m.id)
      } catch (e) {
        const msg = (e as Error).message
        if (/no image/i.test(msg)) { await d.nudge(m.id); out.processed.push(m.id) }       // referenced tweet had no ad → nudge
        else if (/our own tweet/i.test(msg)) { out.skipped.push({ id: m.id, reason: 'self' }) } // they tagged us under one of OUR tweets
        else throw e
      }
    } catch (e) {
      out.errors.push({ id: m.id, error: (e as Error).message })
    }
  }
  return out
}

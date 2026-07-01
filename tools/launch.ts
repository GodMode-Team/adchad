import { sql } from '../lib/db'
import { replies as realReplies } from './xread'
import { xroast, tweetIdOf } from './xroast'

// Launch campaign (spec-14): watch replies to the hand-posted launch tweet, roast every image reply PUBLICLY, then
// deliver the normally-$5 fix FOR FREE. The comp (a tier-5/amount=0/source='launch' order) now happens INSIDE
// xroast() itself, since freeFix:true triggers it there — this is the same comp autonomous prospecting roasts get
// by default while the campaign is armed (tools/xroast.ts's resolveFreeFix). We DON'T fulfill inline — the existing
// single fulfill-worker (scripts/fulfill-worker.ts) drains the comped order exactly like a paid one, so there's one
// fulfiller (no double-post race) and one code path. Goal is engagement, not money — no caps; the kill-switch
// (control.paused) is the only valve. xroast already refuses to post while paused (belt + suspenders).
export type LaunchDeps = {
  control: () => Promise<{ paused: boolean; launchTweetId: string | null }>
  replies: (tweetId: string) => Promise<{ items: { id: string; handle: string | null; created_at?: string }[] }>
  roast: (replyId: string) => Promise<unknown>
  me: () => Promise<string>
}

const DEFAULT: LaunchDeps = {
  control: async () => {
    const [c] = await sql<any[]>`select paused, launch_tweet_id from control where id=1`
    return { paused: !!c?.paused, launchTweetId: c?.launch_tweet_id ?? null }
  },
  replies: realReplies,
  roast: (replyId) => xroast({ tweet: replyId, freeFix: true }), // launch-thread fix is FREE → roast carries no paid-funnel link
  me: async () => process.env.X_HANDLE || 'adchadofficial', // our own handle — static; xpost.ts uses the same fallback
}

type RunResult = {
  reason?: 'disarmed' | 'paused'
  processed: string[]
  skipped: { id: string; reason: 'self' | 'dup' }[]
  errors: { id: string; error: string }[]
}

/** One launch beat: roast each fresh image reply, comp a free fix (the worker delivers it). Idempotent (dedup on reply id). */
export async function run(deps: Partial<LaunchDeps> = {}): Promise<RunResult> {
  const d = { ...DEFAULT, ...deps }
  const out: RunResult = { processed: [], skipped: [], errors: [] }

  const { paused, launchTweetId } = await d.control()
  if (!launchTweetId) return { ...out, reason: 'disarmed' } // no tweet armed → campaign off
  if (paused) return { ...out, reason: 'paused' }            // kill-switch — the only safety valve

  const me = (await d.me()).toLowerCase()
  const { items } = await d.replies(launchTweetId)

  for (const reply of items) {
    try {
      // Guard 1: never roast our own replies — our fix-creative reply carries an image, which would self-roast forever.
      if ((reply.handle ?? '').toLowerCase() === me) { out.skipped.push({ id: reply.id, reason: 'self' }); continue }
      // Guard 2 (dedup): a 'launch' marker keyed on the INCOMING reply id (internal channel — invisible to the /live
      // feed). CLAIM IT BEFORE roasting, so a crash/restart between the public roast and here can never double-post. We
      // also honor the mention runner's claim (channel='mention') — the same reply tags @adchad, so the @adchad-summon
      // path may have already roasted it; without this it gets both a free comp and a $5 roast.
      const [seen] = await sql<any[]>`select 1 from interactions where channel in ('launch','mention') and ref=${reply.id} limit 1`
      if (seen) { out.skipped.push({ id: reply.id, reason: 'dup' }); continue }
      await sql`insert into interactions (channel, direction, ref, text, handled) values ('launch', 'in', ${reply.id}, 'launch reply claimed', true)`
      // ponytail: claim-first = at-most-once roast. A hard failure after the roast posts but before the order commits
      // leaves the reply roasted-without-fix (surfaced in errors[] for manual comp) — preferred over a double public roast.

      await d.roast(reply.id) // xroast: vision→score→roast→public reply→persist prospect+ad+roast-row→comp the free-fix order
      out.processed.push(reply.id)
    } catch (e) {
      out.errors.push({ id: reply.id, error: (e as Error).message })
    }
  }
  return out
}

/** Arm the campaign: store the launch tweet's id (parsed from a URL or bare id) on the control row. */
export async function arm(tweet: string): Promise<{ launchTweetId: string }> {
  const id = tweetIdOf(tweet)
  if (!id) throw new Error('launch arm: a tweet URL or id is required')
  await sql`update control set launch_tweet_id=${id} where id=1`
  return { launchTweetId: id }
}

/** Disarm the campaign: clear the launch tweet id (replies are ignored until re-armed). */
export async function disarm(): Promise<{ launchTweetId: null }> {
  await sql`update control set launch_tweet_id=null where id=1`
  return { launchTweetId: null }
}

import { TwitterApi } from 'twitter-api-v2'

function client() {
  return new TwitterApi({
    appKey: process.env.X_API_KEY!, appSecret: process.env.X_API_SECRET!,
    accessToken: process.env.X_ACCESS_TOKEN!, accessSecret: process.env.X_ACCESS_SECRET!,
  })
}

export type Mention = { id: string; handle: string | null; text?: string; created_at?: string; adTweetId: string | null }

/** Which tweet id holds the ad to roast: the mention's OWN media (a screenshot) → else the tweet it replies to / quotes
 *  (a live X ad it's tagged under) → else null (nothing to roast → nudge). xroast then fetches that tweet's image+author.
 *  Pure — no network — so the resolution is unit-tested. */
export function adTweetOf(tweet: any): string | null {
  if (tweet?.attachments?.media_keys?.length) return tweet.id // the mention itself carries the ad screenshot
  const ref: any[] = tweet?.referenced_tweets ?? []
  const parent = ref.find((r) => r.type === 'replied_to') ?? ref.find((r) => r.type === 'quoted')
  return parent?.id ?? null
}

/** Pure join: mention tweets + includes.users → items with a resolved @handle + the ad's tweet id. Drops tweets whose
 *  author can't be resolved — without the handle we can't tell it isn't our own tweet (roasting our own creative loops). */
export function mapMentions(tweets: any[], users: any[] = []): { items: Mention[] } {
  const handleOf = new Map((users ?? []).map((u: any) => [u.id, u.username]))
  const items = (tweets ?? [])
    .map((t: any) => ({ id: t.id, handle: (handleOf.get(t.author_id) as string) ?? null, text: t.text, created_at: t.created_at, adTweetId: adTweetOf(t) }))
    .filter((it) => !!it.handle)
  return { items }
}

/** Pull recent @adchadofficial mentions so `engage` + the spec-15 `mention` runner can respond. Expands the author
 *  (→ @handle, for the self-skip) and the replied-to/quoted tweet + own media (→ adTweetOf decides which ad to roast).
 *  ponytail: most-recent 100 mentions per beat (the API max) with no cursor — at >100 @adchad summons between two 15m
 *  beats the oldest unprocessed ones fall out of the window and are never roasted; add a since_id cursor + pagination if
 *  a beat overflows 100. free X tier may 403 read endpoints — that's a real signal to escalate a plan upgrade. */
export async function mentions(sinceId?: string): Promise<{ items: Mention[] }> {
  const x = client()
  const me = await x.v2.me()
  const res = await x.v2.userMentionTimeline(me.data.id, {
    max_results: 100,
    ...(sinceId ? { since_id: sinceId } : {}),
    expansions: ['author_id'],
    'tweet.fields': ['author_id', 'created_at', 'conversation_id', 'attachments', 'referenced_tweets'],
    'user.fields': ['username'],
  })
  const got = res.tweets ?? res.data?.data ?? []
  const out = mapMentions(got, res.includes?.users ?? [])
  if (got.length && !out.items.length) console.error('[mention] mentions: got tweets but resolved 0 @handles — author expansion missing (X quota throttle?)')
  return out
}

/** Pure join: tweets + includes.users → reply items with resolved @handles. Drops tweets whose author can't be
 *  resolved — without the handle we can't tell it isn't our own reply, and roasting our own fix-creative loops forever. */
export function mapReplies(tweets: any[], users: any[] = []): { items: { id: string; handle: string | null; created_at?: string }[] } {
  const handleOf = new Map((users ?? []).map((u: any) => [u.id, u.username]))
  const items = (tweets ?? [])
    .map((t: any) => ({ id: t.id, handle: (handleOf.get(t.author_id) as string) ?? null, created_at: t.created_at }))
    .filter((it) => !!it.handle)
  return { items }
}

/** Replies to a tweet that carry an image — the launch-campaign watch. X recent-search on conversation_id with the
 *  has:images operator (text-only replies never come back, so "no image" is filtered server-side). Needs a paid X tier.
 *  ponytail: most-recent 100 image-replies per beat; add a since_id cursor + pagination if a single beat overflows 100. */
export async function replies(tweetId: string, sinceId?: string): Promise<{ items: { id: string; handle: string | null; created_at?: string }[] }> {
  const x = client()
  const res = await x.v2.search(`conversation_id:${tweetId} has:images`, {
    max_results: 100,
    ...(sinceId ? { since_id: sinceId } : {}),
    expansions: ['author_id'],
    'tweet.fields': ['author_id', 'created_at', 'conversation_id'],
    'user.fields': ['username'],
  })
  const got = res.tweets ?? res.data?.data ?? []
  const out = mapReplies(got, res.includes?.users ?? [])
  if (got.length && !out.items.length) console.error('[launch] replies: got tweets but resolved 0 @handles — author expansion missing (X quota throttle?)')
  return out
}

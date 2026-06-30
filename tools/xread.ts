import { TwitterApi } from 'twitter-api-v2'

function client() {
  return new TwitterApi({
    appKey: process.env.X_API_KEY!, appSecret: process.env.X_API_SECRET!,
    accessToken: process.env.X_ACCESS_TOKEN!, accessSecret: process.env.X_ACCESS_SECRET!,
  })
}

/** Pull recent @adchadofficial mentions/replies so `engage` can respond.
 *  ponytail: free X tier may 403 read endpoints — that's a real signal for the agent to escalate a plan upgrade. */
export async function mentions(sinceId?: string): Promise<{ items: any[] }> {
  const x = client()
  const me = await x.v2.me()
  const res = await x.v2.userMentionTimeline(me.data.id, {
    max_results: 20,
    ...(sinceId ? { since_id: sinceId } : {}),
    'tweet.fields': ['author_id', 'created_at', 'conversation_id'],
  })
  const items = (res.data?.data ?? []).map((t) => ({
    id: t.id, from: t.author_id, text: t.text, created_at: t.created_at, conversation_id: t.conversation_id,
  }))
  return { items }
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

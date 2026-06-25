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

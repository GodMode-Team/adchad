import { TwitterApi } from 'twitter-api-v2'

function client() {
  return new TwitterApi({
    appKey: process.env.X_API_KEY!, appSecret: process.env.X_API_SECRET!,
    accessToken: process.env.X_ACCESS_TOKEN!, accessSecret: process.env.X_ACCESS_SECRET!,
  })
}

type PostOpts = {
  text: string
  imageUrl?: string | null
  link?: string | null
  handle?: string | null
  replyToTweetId?: string | null // set → post as a reply (e.g. deliver the fix into the roast thread)
}

/** Assemble the v2.tweet payload — pure (no network) so it's unit-testable. @handle + link reserve room; 280 cap. */
export function buildTweet(opts: Omit<PostOpts, 'imageUrl'>, mediaId?: string) {
  const tag = opts.handle ? `@${opts.handle} ` : ''
  const link = opts.link ? `\n${opts.link}` : ''
  const room = 280 - tag.length - 24 // t.co wraps any URL to ~23 chars
  const body = opts.text.length > room ? opts.text.slice(0, room - 1).trimEnd() + '…' : opts.text
  return {
    text: `${tag}${body}${link}`,
    ...(mediaId ? { media: { media_ids: [mediaId] as [string] } } : {}),
    ...(opts.replyToTweetId ? { reply: { in_reply_to_tweet_id: opts.replyToTweetId } } : {}),
  }
}

/** Post a roast/fix with the ad image; @-tag `handle` for Segment A; reply into a thread with `replyToTweetId`. */
export async function xpost(opts: PostOpts): Promise<{ tweetId: string; url: string }> {
  const x = client()

  let mediaId: string | undefined
  if (opts.imageUrl) {
    try {
      const res = await fetch(opts.imageUrl)
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer())
        mediaId = await x.v1.uploadMedia(buf, { mimeType: res.headers.get('content-type') || 'image/jpeg' })
      }
    } catch { /* media upload may be gated on free tier — fall back to text-only */ }
  }

  const tweet = await x.v2.tweet(buildTweet(opts, mediaId))
  const id = tweet.data.id
  const handle = await x.v2.me().then((m) => m.data.username).catch(() => 'adchadofficial')
  return { tweetId: id, url: `https://x.com/${handle}/status/${id}` }
}

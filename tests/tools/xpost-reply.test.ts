import { describe, it, expect } from 'vitest'
import { buildTweet } from '../../tools/xpost'

// Delivering the fix on X means replying to the roast tweet — the v2.tweet payload must carry
// reply.in_reply_to_tweet_id. buildTweet is the pure payload assembler (no network) so we can assert it.
describe('xpost — reply + payload assembly', () => {
  it('includes reply.in_reply_to_tweet_id when replyToTweetId is set', () => {
    const p = buildTweet({ text: 'fixed it', replyToTweetId: '12345' })
    expect(p.reply).toEqual({ in_reply_to_tweet_id: '12345' })
    expect(p.text).toContain('fixed it')
  })

  it('omits reply for a top-level tweet', () => {
    expect(buildTweet({ text: 'hi' }).reply).toBeUndefined()
  })

  it('attaches media when a mediaId is given', () => {
    expect(buildTweet({ text: 'hi' }, 'media99').media).toEqual({ media_ids: ['media99'] })
  })

  it('truncates over-long text so it fits (handle + link reserved)', () => {
    const p = buildTweet({ text: 'x'.repeat(400), handle: 'foo', link: 'https://adchad.vercel.app/p/abc' })
    expect(p.text).toMatch(/…/)
    expect(p.text.startsWith('@foo ')).toBe(true)
  })
})

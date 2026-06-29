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
    expect(buildTweet({ text: 'hi' }, ['media99']).media).toEqual({ media_ids: ['media99'] })
  })

  it('attaches up to 4 media_ids for an A/B variant pack', () => {
    expect(buildTweet({ text: 'hi' }, ['a', 'b', 'c']).media).toEqual({ media_ids: ['a', 'b', 'c'] })
  })

  it('omits media when the id list is empty', () => {
    expect(buildTweet({ text: 'hi' }, []).media).toBeUndefined()
  })

  it('keeps a full roast intact (Premium long-form, no 280 cut-off)', () => {
    const p = buildTweet({ text: 'x'.repeat(600), handle: 'foo', link: 'https://adchad.ai/p/abc' })
    expect(p.text).not.toMatch(/…/) // not truncated
    expect(p.text).toContain('x'.repeat(600)) // whole roast present
    expect(p.text.startsWith('@foo ')).toBe(true)
  })

  it('still caps absurdly long text at the Premium limit', () => {
    const p = buildTweet({ text: 'x'.repeat(26_000) })
    expect(p.text.length).toBeLessThanOrEqual(25_000)
    expect(p.text).toMatch(/…/)
  })
})

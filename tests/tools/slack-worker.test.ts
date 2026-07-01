import { describe, it, expect } from 'vitest'
import { pickImageFile, formatFixReply } from '../../scripts/slack-worker'

describe('slack-worker — deterministic @AdChad handler helpers', () => {
  it('pickImageFile returns the first image attachment, ignores non-images', () => {
    expect(pickImageFile(undefined)).toBeNull()
    expect(pickImageFile([])).toBeNull()
    expect(pickImageFile([{ mimetype: 'application/pdf' }])).toBeNull()
    const img = { mimetype: 'image/png', url_private: 'https://slack/x.png' }
    expect(pickImageFile([{ mimetype: 'text/plain' }, img])).toBe(img)
  })

  it('formatFixReply includes headline/body/cta + the mockup AND the uploadable creative', () => {
    const f: any = { imageUrls: ['http://mock.png'], creativeUrls: ['http://bare.png'], headline: 'Cut Your $47k Bill', body: 'B', cta: 'Get Quote' }
    const m = formatFixReply(f)
    expect(m).toContain('Cut Your $47k Bill')
    expect(m).toContain('Get Quote')
    expect(m).toContain('http://mock.png')  // live mockup
    expect(m).toContain('http://bare.png')  // uploadable creative
  })

  it('formatFixReply falls back to the mockup URL when there is no bare creative', () => {
    const f: any = { imageUrls: ['http://mock.png'], headline: 'H', body: 'B', cta: 'C' }
    expect(formatFixReply(f)).toContain('http://mock.png')
  })
})

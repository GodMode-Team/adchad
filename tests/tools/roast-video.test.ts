import { describe, it, expect } from 'vitest'
import { VIDEO_NOTE } from '../../tools/roast'
import { VISION_PROMPT } from '../../tools/vision'

// the team's catch (recurring): a VIDEO ad's burned-in caption ("The IRS") got ROASTED as text "slapped on his hands".
// The vision-only rule wasn't enough — the misattribution surfaced at the ROAST layer. Two-part fix: vision must FLAG
// is_video (a structured output the model has to actively set), and the roast context must then tell Grok the on-image
// text is a caption — never printed on the person, their hands, clothing, or any object.
describe('video caption guardrail', () => {
  it('vision asks for an is_video flag + forbids attributing a caption to a person (incl. hands/body)', () => {
    expect(VISION_PROMPT).toMatch(/is_video/)
    expect(VISION_PROMPT).toMatch(/caption|subtitle/i)
    expect(VISION_PROMPT).toMatch(/hands|body/i)
  })
  it('roast VIDEO_NOTE tells Grok burned-in video text is a caption, never printed on the person/hands/clothing', () => {
    expect(VIDEO_NOTE).toMatch(/caption|subtitle/i)
    expect(VIDEO_NOTE).toMatch(/video/i)
    expect(VIDEO_NOTE).toMatch(/hands|clothing|object/i)
  })
})

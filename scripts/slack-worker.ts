import { config } from 'dotenv'
config({ path: '.env.local' })
import { App } from '@slack/bolt'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { roast } from '../tools/roast'
import { fix, type FixResult } from '../tools/fix'

// DETERMINISTIC Slack handler for @AdChad — replaces the Hermes agent on the Slack surface. The agent (Nemotron)
// looped forever trying to orchestrate roast→fulfill; this just RUNS the tools: @mention + an ad image → roast
// (vision + Grok) → fix (deterministic Meta mockup) → reply in-thread. ~20s, no agent, no 50-iteration loop.
// Socket Mode uses the same tokens Hermes did (SLACK_BOT_TOKEN + SLACK_APP_TOKEN); run it INSTEAD of the gateway.

const BOT = process.env.SLACK_BOT_TOKEN
const ALLOWED = (process.env.SLACK_ALLOWED_USERS || '').split(',').map((s) => s.trim()).filter(Boolean)

/** first image attachment on the message (Slack sends files[] with a mimetype), else null — pure, testable. */
export function pickImageFile(files: any[] | undefined): any | null {
  return (files ?? []).find((f) => String(f?.mimetype || '').startsWith('image/')) ?? null
}

/** the "here's the fix" Slack message (pure, testable). */
export function formatFixReply(f: FixResult): string {
  const creative = f.creativeUrls?.[0] || f.imageUrls[0]
  return (
    `🔧 *Here's the fix — ready to run:*\n` +
    `*Headline:* ${f.headline}\n*Primary text:* ${f.body}\n*CTA:* ${f.cta}\n\n` +
    `*Live mockup:* ${f.imageUrls[0]}\n*Uploadable creative (drop into Meta):* ${creative}`
  )
}

async function downloadImage(file: any): Promise<string | null> {
  const res = await fetch(file.url_private, { headers: { Authorization: `Bearer ${BOT}` } })
  if (!res.ok) return null
  const p = join(mkdtempSync(join(tmpdir(), 'adchad-slack-')), file.name || 'ad.png')
  writeFileSync(p, Buffer.from(await res.arrayBuffer()))
  return p
}

/** Wire the Socket-Mode listener and connect. Guarded so importing this module (tests) has no side effects. */
async function main() {
  const APP_TOKEN = process.env.SLACK_APP_TOKEN
  if (!BOT || !APP_TOKEN) { console.error('[slack] missing SLACK_BOT_TOKEN / SLACK_APP_TOKEN — set them in .env.local'); process.exit(1) }

  const app = new App({ token: BOT, appToken: APP_TOKEN, socketMode: true })
  const seen = new Set<string>() // dedup redelivered Socket Mode events

  app.event('app_mention', async ({ event, client }) => {
    const e = event as any
    if (seen.has(e.ts)) return
    seen.add(e.ts)
    if (seen.size > 500) seen.clear() // ponytail: bounded memory; a stale re-fire after a clear is at worst one dup
    if (ALLOWED.length && e.user && !ALLOWED.includes(e.user)) return

    const channel = e.channel
    const thread_ts = e.thread_ts || e.ts
    const reply = (text: string) => client.chat.postMessage({ channel, thread_ts, text, unfurl_links: true }).catch(() => {})

    const file = pickImageFile(e.files)
    if (!file?.url_private) { await reply('Drop an ad *image* on your @AdChad message and I\'ll roast + fix it.'); return }

    await client.reactions.add({ channel, timestamp: e.ts, name: 'hammer_and_wrench' }).catch(() => {})
    try {
      const img = await downloadImage(file)
      if (!img) { await reply('Couldn\'t download that image from Slack.'); return }
      const r = await roast({ image: img, handle: null, brand: null }) // vision + Grok, ~15s
      await reply(`*Chad Radar: ${r.score}/100* — ${r.verdict}\n\n${r.xPost}`)
      const f = await fix({ image: img, brand: null, roast: r.xPost }) // deterministic Meta mockup
      await reply(formatFixReply(f))
    } catch (err) {
      await reply(`Roast/fix failed: ${(err as Error).message.slice(0, 200)}`)
    }
  })

  await app.start()
  console.log('[slack] deterministic AdChad handler connected (Socket Mode) — @mention + image → roast + fix')
}

if (process.argv[1]?.endsWith('slack-worker.ts')) main()

import { config } from 'dotenv'
config({ path: '.env.local' })

// One CLI for every tool the agent calls: `pnpm -s tool <name> [sub] [--flag value]` → one JSON line on stdout.
export function flags(argv: string[]): Record<string, string | boolean> {
  const o: Record<string, string | boolean> = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) continue // positional (e.g. the subcommand) — ignored here
    const k = a.slice(2)
    const nx = argv[i + 1]
    if (nx === undefined || nx.startsWith('--')) o[k] = true
    else { o[k] = nx; i++ }
  }
  return o
}

async function dispatch(name: string, sub: string | undefined, f: Record<string, string | boolean>): Promise<unknown> {
  const S = (k: string, d = '') => (f[k] != null ? String(f[k]) : d)
  const N = (k: string, d: number) => (f[k] != null ? Number(f[k]) : d)
  switch (name) {
    case 'foreplay': {
      const { scan } = await import('../tools/foreplay')
      const { ads, prospects } = await scan(S('query', 'med spa'), N('n', 10))
      // ponytail: drop `raw` + truncate `copy` before printing — the full blob (~39k chars) rode every
      // subsequent LLM prefill. Full data is still persisted to the DB by scan(); the agent only needs these fields.
      const slim = ads.map(({ raw, copy, ...a }) => ({ ...a, copy: copy ? copy.slice(0, 280) : null }))
      return { ads: slim, prospects }
    }
    case 'enrich': {
      const { enrich } = await import('../tools/enrich')
      return enrich({ id: S('id'), name: f.name ? S('name') : null, link_url: f.link ? S('link') : null })
    }
    case 'xpost': {
      const { xpost } = await import('../tools/xpost')
      return xpost({ text: S('text'), imageUrl: f.image ? S('image') : null, link: f.link ? S('link') : null, handle: f.handle ? S('handle') : null, replyToTweetId: f.reply ? S('reply') : null })
    }
    case 'xroast': {
      const { xroast } = await import('../tools/xroast')
      return xroast({ tweet: S('tweet') })
    }
    case 'xread': {
      const m = await import('../tools/xread')
      if (f.replies) return m.replies(S('replies'), f.since ? S('since') : undefined) // launch-campaign reply watch
      return m.mentions(f.since ? S('since') : undefined)
    }
    case 'launch': {
      const { run, arm, disarm } = await import('../tools/launch')
      if (sub === 'set') return arm(S('tweet'))   // `launch set --tweet <url|id>` — arm the campaign
      if (sub === 'off') return disarm()          // `launch off` — disarm
      return run()                                // `launch run` (default) — process one beat of replies
    }
    case 'email': {
      const m = await import('../tools/email')
      return sub === 'read' ? m.read() : m.send({ to: S('to'), subject: S('subject'), body: S('body') })
    }
    case 'creative': {
      const { generate } = await import('../tools/creative')
      return generate({ headline: S('headline'), body: f.body ? S('body') : null, cta: f.cta ? S('cta') : null, creativeDirection: f.direction ? S('direction') : null })
    }
    case 'vision': {
      const { describe } = await import('../tools/vision')
      return describe(S('image'))
    }
    case 'roast': {
      const { roast, salesLink } = await import('../tools/roast')
      const pid = f['prospect-id'] ? S('prospect-id') : null
      const r = await roast({ image: S('image'), handle: f.handle ? S('handle') : null, brand: f.brand ? S('brand') : null, adId: f['ad-id'] ? S('ad-id') : null, prospectId: pid })
      // xroast attaches the real /p/<id> link via xpost AFTER it knows the prospect id; this standalone tool just
      // returns text a human/agent pastes (e.g. into Slack), so attach our REAL adchad.ai link here too — never
      // ship a roast without it (roast() already stripped any URL the model hallucinated, e.g. "chadfix.com/5").
      const url = salesLink(pid)
      return { ...r, xPost: `${r.xPost}\n${url}`, salesUrl: url }
    }
    case 'fix': {
      const { fix } = await import('../tools/fix')
      return fix({ image: S('image'), brand: f.brand ? S('brand') : null, roast: f.roast ? S('roast') : null })
    }
    case 'stripe': {
      const { checkout } = await import('../tools/stripe')
      return checkout({ prospect: S('prospect'), tier: N('tier', 5) })
    }
    case 'db': {
      const { run } = await import('../tools/db')
      return run(sub, f)
    }
    default: {
      // ponytail: skill names share no namespace with this CLI, but the model sees `pnpm -s tool <x>` all over the
      // skills and pattern-completes `tool prospect`. Redirect instead of dead-ending — a wasted round-trip is ~10-140s here.
      const SKILLS = ['prospect', 'roast', 'engage', 'fulfill', 'report', 'evolve', 'copy', 'synthcheck', 'adchad']
      if (SKILLS.includes(name))
        throw new Error(`'${name}' is a SKILL you're already running, not a tool — don't call \`tool ${name}\`. Follow the skill's steps using the real tools: foreplay enrich vision roast xroast fix xpost xread email creative stripe db launch`)
      throw new Error(`unknown tool '${name}'. tools: foreplay enrich vision roast xroast fix xpost xread email creative stripe db launch`)
    }
  }
}

// Run the CLI only when invoked directly (`tsx scripts/tool.ts`), not when imported (e.g. by tests).
if (process.argv[1]?.endsWith('tool.ts')) {
  const [name, ...rest] = process.argv.slice(2)
  const sub = rest[0] && !rest[0].startsWith('--') ? rest[0] : undefined
  dispatch(name, sub, flags(rest))
    .then((out) => { console.log(JSON.stringify(out)); process.exit(0) })
    .catch((e) => { console.error(e); console.log(JSON.stringify({ error: String(e?.message).slice(0, 200) })); process.exit(1) })
}

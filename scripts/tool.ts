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
      return { ads, prospects }
    }
    case 'enrich': {
      const { enrich } = await import('../tools/enrich')
      return enrich({ id: S('id'), name: f.name ? S('name') : null, link_url: f.link ? S('link') : null })
    }
    case 'xpost': {
      const { xpost } = await import('../tools/xpost')
      return xpost({ text: S('text'), imageUrl: f.image ? S('image') : null, link: f.link ? S('link') : null, handle: f.handle ? S('handle') : null })
    }
    case 'xread': {
      const { mentions } = await import('../tools/xread')
      return mentions(f.since ? S('since') : undefined)
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
    case 'stripe': {
      const { checkout } = await import('../tools/stripe')
      return checkout({ prospect: S('prospect'), tier: N('tier', 5) })
    }
    case 'db': {
      const { run } = await import('../tools/db')
      return run(sub, f)
    }
    default:
      throw new Error(`unknown tool '${name}'. tools: foreplay enrich xpost xread email creative stripe db`)
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

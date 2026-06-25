import { config } from 'dotenv'
config({ path: '.env.local' })
import { runBatch } from '../lib/loop'
import { sql } from '../lib/db'

export type Args = { n: number; query: string; dryRun: boolean }

/** Parse the Hermes skill's argv. ponytail: dry-run is the default — only `--live` publishes. */
export function parseArgs(argv: string[]): Args {
  let n = 5,
    query = 'med spa',
    dryRun = true
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--n') n = Math.max(1, parseInt(argv[++i], 10) || n)
    else if (a === '--query') query = argv[++i] ?? query
    else if (a === '--live') dryRun = false
    else if (a === '--dry-run') return { n, query, dryRun: true } // explicit safety wins, ignore later --live
  }
  return { n, query, dryRun }
}

async function main() {
  const { n, query, dryRun } = parseArgs(process.argv.slice(2))
  const r = await runBatch(n, { query, dryRun })
  // Human summary on stderr; single machine-readable JSON line on stdout so Hermes parses cleanly.
  console.error(
    `AdChad run #${r.runId}: scanned ${r.scanned} · enriched ${r.enriched} · qualified ${r.qualified} · ` +
      `posted ${r.posted} · emailed ${r.emailed} · errors ${r.errors.length}` +
      (dryRun ? '  (DRY RUN — nothing published)' : ''),
  )
  console.log(JSON.stringify({ ok: true, mode: dryRun ? 'dry-run' : 'live', ...r }))
  await sql.end()
}

// Run only when invoked as a script, not when the test imports parseArgs.
if (process.argv[1]?.includes('run-once')) {
  main().catch((e) => {
    console.error(e)
    console.log(JSON.stringify({ ok: false, error: String(e?.message).slice(0, 200) }))
    process.exit(1)
  })
}

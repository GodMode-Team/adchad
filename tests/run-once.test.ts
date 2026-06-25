import { describe, it, expect } from 'vitest'
import { parseArgs } from '../scripts/run-once'

// The Hermes skill shells out to `pnpm run-once`. The one thing that MUST be right:
// publishing is opt-in. A wrong default = the agent roasts real businesses in public by accident.
describe('run-once CLI (Hermes harness entry)', () => {
  it('defaults to a DRY RUN — going live must be explicit', () => {
    expect(parseArgs([]).dryRun).toBe(true)
    expect(parseArgs(['--n', '3', '--query', 'dentist']).dryRun).toBe(true)
  })
  it('--live is the ONLY way to publish', () => {
    expect(parseArgs(['--live']).dryRun).toBe(false)
    expect(parseArgs(['--live', '--dry-run']).dryRun).toBe(true) // explicit --dry-run wins
  })
  it('parses n and query', () => {
    const a = parseArgs(['--n', '8', '--query', 'med spa'])
    expect(a.n).toBe(8)
    expect(a.query).toBe('med spa')
  })
})

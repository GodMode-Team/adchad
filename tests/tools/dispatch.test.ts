import { describe, it, expect } from 'vitest'
import { flags } from '../../scripts/tool'

// Pure (no network): guards the publish-safety boundary — the CLI must parse flags exactly,
// so a stray positional never becomes a value and a bare flag never swallows the next token.
describe('tool dispatcher — flag parsing', () => {
  it('parses --key value pairs and ignores the leading subcommand positional', () => {
    expect(flags(['scan', '--query', 'med spa', '--n', '3'])).toEqual({ query: 'med spa', n: '3' })
  })

  it('treats a bare flag with no following value as boolean true', () => {
    expect(flags(['--live'])).toEqual({ live: true })
  })

  it('keeps numeric-looking values as strings', () => {
    expect(flags(['--query', 'x', '--n', '5'])).toEqual({ query: 'x', n: '5' })
  })

  it('returns {} when there are no flags at all', () => {
    expect(flags([])).toEqual({})
    expect(flags(['scan', 'sub'])).toEqual({})
  })

  it('a flag immediately followed by another flag is boolean, not its value', () => {
    expect(flags(['--live', '--query', 'x'])).toEqual({ live: true, query: 'x' })
  })
})

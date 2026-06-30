# Run log — live feed (`/live`, spec-09) + prospect spiral-guard (spec-02)

## Chunk B — /live feed (TDD)

### RED (test-engineer, before implementation)
`pnpm exec vitest run tests/tools/db-feed.test.ts tests/feed-route.test.ts`
- `tests/tools/db-feed.test.ts` — 5 FAIL: `db: unknown op 'feed'. try: metrics ledger prospects record stage spend revenue pause resume status` (thrown at `tools/db.ts:89`).
- `tests/feed-route.test.ts` — FAIL (suite): `Cannot find module '../app/api/feed/route'` (route file did not exist).
- Totals: Test Files 2 failed (2); Tests 5 failed (5).

### GREEN (after implementing `feed` op + route + review fixes)
`pnpm exec vitest run tests/tools/db-feed.test.ts tests/feed-route.test.ts` — 2026-06-26 16:30
```
 ✓ tests/tools/db-feed.test.ts (6 tests) 2183ms
 ✓ tests/feed-route.test.ts (1 test) 921ms
 Test Files  2 passed (2)
      Tests  7 passed (7)
```
The 6 db-feed tests: events/stats shape · newest-first + ts/kind/title · numeric `stats.margin_cents` · seeded roast surfaced · **PII never leaked** (email + inbound-email body + from_addr/subject/buyer_email) · **Stripe-id stripped** from money lines. Route test: 200 JSON + events[] + stats + `no-store`.

### Full suite (regression) — 2026-06-26
`pnpm test` → Test Files 7 passed (7); Tests 16 passed | 3 skipped (Stripe gated, no local key). No regressions.

### Typecheck
`npx tsc --noEmit` → exit 0 (clean; the `verify-deps-before-run` line is an npm warning about a pnpm-only `.npmrc` key, not a TS error).

## Chunk A — prospect spiral-guard (skill prose; QA-gated)
Implementation: `skills/prospect/SKILL.md` step 2 (bare-niche + broaden-once-then-stop). No unit test (prose). Manual-QA evidence: see `manual-qa-log.md` → "prospect spiral-guard".

---

# Redesign — creative score + on-demand roast (spec-11) — RED→GREEN

### RED (before implementation)
`pnpm exec vitest run` per file:
- `tests/tools/score.test.ts` — FAIL: `vision.describe()` returns no `score` (`expected 'undefined' to be 'number'`).
- `tests/tools/db-score.test.ts` — 3 FAIL: `db: unknown op 'score'`; `db page`/`db feed` carry no numeric `score`.
- `tests/tools/db-intake.test.ts` — FAIL: `db: unknown op 'intake'` (thrown at tools/db.ts default).
- `tests/ratelimit.test.ts` — FAIL (suite): `Cannot find module '../lib/ratelimit'`.

### GREEN (after implementation)
- `vitest run tests/tools/score.test.ts tests/tools/db-score.test.ts` → Test Files 2 passed, **Tests 4 passed**.
- `vitest run tests/ratelimit.test.ts tests/tools/db-intake.test.ts` → Test Files 2 passed, **Tests 3 passed**.
- Adversarial MAJOR-1 fix — agent path persists the score: `vitest run tests/tools/roast-score.test.ts` → **1 passed** (10.6s; writes `scores.total=42` when `roast()` is given `--ad-id`+`--prospect-id`).
- Full suite `pnpm test` → **Test Files 12 passed; Tests 33 passed | 3 skipped**. `npx tsc --noEmit` → exit 0.

## Pages (Chunks 4–6) + design system (Chunk 1)
Presentational → Manual QA (chrome-devtools @390px + desktop), see `manual-qa-log.md` → "Brand redesign". No component-test harness in the repo (vitest = tools/routes only).

## spec-14 Launch campaign — 2026-06-29

**Plan:** ~/.claude/plans/replicated-finding-backus.md (approved). Pipeline run by main-context Claude.

**Step 2 — Failing test (RED):** `tests/tools/launch.test.ts`
```
× mapReplies … drops unresolvable authors → expected { items: [] } to deeply equal { items: [ { id: '111', … } ] }
× launch.run happy path → not implemented
× launch.run skip self → not implemented
× launch.run skip dup → not implemented
× launch.run disarmed → not implemented
× launch.run paused → not implemented
FAIL launch.arm/disarm → PostgresError: column "launch_tweet_id" does not exist
Tests  6 failed | 1 passed | 1 skipped (8)
```

**Step 3 — Implementation (GREEN):** schema alters (`control.launch_tweet_id`, `orders.source`), `mapReplies`+`replies` in `tools/xread.ts`, `tools/launch.ts` (run/arm/disarm + realDeps), CLI dispatch in `scripts/tool.ts`, engage-cron line, spec fixes.
```
pnpm migrate → migrated ✓
npx vitest run tests/tools/launch.test.ts → Tests  8 passed (8)
npx tsc --noEmit → exit 0
npx vitest run dispatch.test.ts xpost-reply.test.ts → 12 passed (no regression)
```

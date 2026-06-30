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

**Step 6 — Manual QA:** live public e2e — 2 real ad replies (Range, TaxQuotes) → public roast + in-thread fix, all 6 tweets verified live + correctly threaded (launch→reply→roast→fix). Orders 183/184 comped ($0/source=launch), excluded from public sales count.
**Step 7 — Adversarial review:** VERDICT PASS (all criteria mapped to file:line; 6 code-review fixes confirmed present; leak sweep clean; 4 non-gating minors).
**Step 8 — Commit:** `3a58473` on feat/launch-campaign.
**Step 9 — Retro:** 2 general lessons (first occurrence → logged, not yet promoted per the 2+-occurrence rule):
  1. Reusing a background-worker-drained queue → DON'T also process inline. Inserting a row a poller drains AND fulfilling it inline = cross-process double-execution race (here: launch inline-fulfill vs fulfill-worker). Watch for in code-review: "new code inserts a row a worker drains AND acts on it inline."
  2. Internal marker/bookkeeping rows on a shared table can leak onto public readers. interactionEvent's generic `direction='in'` branch rendered the dedup marker in /live. When adding an internal row to a table with public readers, grep EVERY reader and confirm it's filtered.
  Test-quality note (adversarial minor): 2 regression tests (feed-guard, metrics-exclusion) lack isolated RED — acceptable, logged.

## spec-15 `@adchad` summon (mention → roast + $5 link) — 2026-06-30

**Plan:** ~/.claude/plans/peaceful-wobbling-ullman.md (approved). Pipeline run by main-context Claude (test-engineer/code-reviewer/manual-qa agents not registered this session → test+impl+QA in main context, `/code-review`+`/security-review` skills for the gates, `adversarial-diff-reviewer` agent for step 7).

**Step 2 — Failing test (RED):** `tests/tools/mention.test.ts` + throwing stubs (`adTweetOf`/`mapMentions` in xread.ts, `run` in new mention.ts).
`npx vitest run tests/tools/mention.test.ts` → **Tests 16 failed (16)**:
```
× adTweetOf (×6) → not implemented
× mapMentions (×2) → not implemented
× mention.run happy/parent/no-ad/no-image/self/dup/paused (×7) → not implemented
× interactionEvent mention-exclusion → expected { kind:'reply', title:'Acme replied' …} to be null (the launch-marker leak pattern, now for channel='mention')
```

**Step 3 — Implementation (GREEN):** `adTweetOf`+`mapMentions`+upgraded `mentions()` in `tools/xread.ts`; `xroast({tweet, replyTo?})` + self-roast guard in `tools/xroast.ts`; new `tools/mention.ts` (`run`/`NUDGE_TEXT`); `interactionEvent` mention-exclusion in `tools/db.ts`; `mention` dispatch + tool-list in `scripts/tool.ts`; engage SKILL step 0.5; spec-15 Resolve/Roast bullets.
```
npx vitest run tests/tools/mention.test.ts → Tests 16 passed (16)
npx vitest run (full)                      → Test Files 27 passed; Tests 112 passed | 3 skipped (115)
npx tsc --noEmit                           → exit 0
```

**Step 4 — Code review (high effort, 2 finder angles):** 1 BLOCKER + 1 MAJOR FIXED, 3 MINOR WONTFIX (see code-reviewer-log.md). The BLOCKER (cross-source double-roast) fixed RED→GREEN both directions:
```
RED (before widening the dedup SELECT) — npx vitest run tests/tools/mention.test.ts tests/tools/launch.test.ts:
× launch.run … skips a reply already claimed by the MENTION runner (no cross-source double-roast)
× mention.run … skips a mention whose tweet already carries a LAUNCH dedup marker
Tests  2 failed | 26 passed (28)
GREEN (after `channel in ('launch','mention')` in both runners):
✓ launch.test.ts (11) ✓ mention.test.ts (17) → Tests 28 passed (28); full suite 114 passed | 3 skipped; tsc exit 0
```
**Step 5 — Security review:** no HIGH/MEDIUM findings (SQL parameterized; mention text not fed to LLM in v1; @handle X-constrained; no new secrets/auth; path-traversal branch unreachable on this flow). security-review-log.md.
**Step 6 — Manual QA (live X API + shared DB, no public posts):** `xread --mentions` → real 15-item read, new shape + `adTweetOf` both branches confirmed on live data (own-media→own id; no-media reply→parent ad id); `mention run` → `{processed:[],skipped:[15× self],errors:[]}` (self-skip validated, no post/spend/comp); `db pause`→`mention run`→`{reason:'paused'}`→restored `{paused:false}`. Public 3rd-party-mention roast e2e UNVERIFIED-gated (our login self-skips) — same honest gap as spec-14. manual-qa-log.md.
**Step 7 — Adversarial review:** VERDICT PASS (all 6 probes mapped to file:line; cross-source BLOCKER confirmed closed both directions; never-comp invariant confirmed; 1 non-blocking minor — the RED above now closes it).
**Step 8 — Commit:** `557d4af` on feat/launch-campaign (10 files, spec-15 code+spec+tests only; unrelated working-tree noise + pipeline logs left uncommitted, matching spec-14's pattern). `/simplify` skipped — the code-review simplification finder already swept this diff; its only cleanup findings were the launch/mention DRY duplication, consciously declined (ponytail, 2 occurrences).
**Step 9 — Retro:** ONE general lesson, and it's the **2nd occurrence** of the shared-table-marker bug class → PROMOTED.
  - spec-14 retro lesson #2 was the READER side: an internal marker leaked onto a public reader (`interactionEvent` → /live). This chunk hit the WRITER side: two sibling runners claim per-channel markers on the same `ref`, so each must widen its dedup SELECT to cover ALL sibling channels (`channel in ('launch','mention')`) — else cross-source double-processing. Same root class (shared-table markers), now caught twice.
  - Promotion: the `adversarial-diff-reviewer` recorded both halves to its own memory — `probe-exclusion-tag-all-readers.md` (every READER must filter the marker) + new `probe-shared-dedup-all-claimers.md` (every sibling CLAIM-WRITER must check for it). The agent will apply both probes going forward.
  - Process note (no code lesson): the pipeline's named agents (test-engineer/code-reviewer/manual-qa) aren't registered this session → ran test+impl+QA in main context, `/code-review`+`/security-review` skills + general-purpose finders for the gates, real `adversarial-diff-reviewer` for step 7. Per CLAUDE.md "adapt names to the project's stack."

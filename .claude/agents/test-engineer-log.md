# test-engineer log

## spec-11 — Creative score (0–100) — TDD RED

**Date:** 2026-06-26
**Feature:** add `score` (integer 0–100, lower = worse) + `verdict` (string) to `vision.describe()` / `AdLook`, a new `score` op in `tools/db.ts` persisting to the existing `scores` table, and surface the latest score on `db page` + `db feed` roast events.
**Stance:** RED only — tests written to fail NOW, pass once the score is threaded through. No implementation; `tools/vision.ts` and `tools/db.ts` left untouched.

### Test files written
- `tests/tools/score.test.ts` — live, no mocks. Pulls a REAL Foreplay ad creative (`scan('med spa', 1)` → `ads[].creative_url`, dynamic `ctx.skip()` if none came back), calls `vision.describe(creativeUrl)` (imported aliased as `visionLook` — vision's fn shares the name `describe` with vitest), asserts `score` is an integer 0–100, `verdict` is a non-empty string, and `real_flaws` stays an array (unchanged contract).
- `tests/tools/db-score.test.ts` — live, no mocks. Seeds an `ads` + `prospects` + `interactions` (`channel='x'`, `direction='out'`, marked roast text) row under id `test-score-<uniq>`; cleans up in `afterAll` (scores → interactions → ads → prospects). Three ordered tests:
  - **A** `run('score', { ad_id, prospect_id, total: 23 })` records to `scores`; `select total from scores where ad_id=...` → 23.
  - **B** `run('page', { id })` includes a numeric `score` === 23 (the value A recorded).
  - **C** `run('feed', {})` roast event for that ad carries a numeric `score` === 23.

### RED evidence — `pnpm exec vitest run tests/tools/score.test.ts tests/tools/db-score.test.ts`

```
 FAIL  tests/tools/db-score.test.ts > ... > records a score to the scores table via run('score', ...)
Error: db: unknown op 'score'. try: metrics ledger prospects page orders gallery feed record stage spend revenue pause resume status
 ❯ run tools/db.ts:125:13

 FAIL  tests/tools/db-score.test.ts > ... > db page --id <prospect> includes the numeric score
AssertionError: expected 'undefined' to be 'number' // Object.is equality
 ❯ tests/tools/db-score.test.ts:41:30   (typeof out.score)

 FAIL  tests/tools/db-score.test.ts > ... > db feed roast event carries the numeric score
AssertionError: expected 'undefined' to be 'number' // Object.is equality
 ❯ tests/tools/db-score.test.ts:52:37   (typeof roastEvent.score)

 FAIL  tests/tools/score.test.ts > ... > returns an integer score 0–100 + a non-empty verdict, keeping real_flaws
AssertionError: expected 'undefined' to be 'number' // Object.is equality
 ❯ tests/tools/score.test.ts:22:31      (typeof look.score)

 Test Files  2 failed (2)
      Tests  4 failed (4)
```

All four fail for the intended contract gaps: `score` op absent (`unknown op 'score'`), `db page`/`db feed` carry no `score`, and `vision.describe()` returns no `score`/`verdict` (the vision test ran the real call — it did NOT skip, so a real ad was scored and the missing field surfaced). RED confirmed.

## spec-09 — Live feed (`/live`) — TDD RED

**Date:** 2026-06-26
**Feature:** `feed` op in `tools/db.ts` + `app/api/feed/route.ts` powering the PUBLIC `/live` timeline.
**Stance:** RED only — tests written to fail NOW, pass once the `feed` op + route are built. No implementation.

### Test files written
- `tests/tools/db-feed.test.ts` — live DB, no mocks. Seeds a marked prospect, a roast interaction carrying private columns (`from_addr='secret@private.test'`, `subject='SECRET'`, `text='SEEDED ROAST'`), and a revenue ledger row; cleans up in `afterAll`. Asserts on `run('feed', {})`:
  - `events` is an array, `stats` is an object
  - events newest-first (ts descending), each has `ts`/`kind`/`title`
  - `stats.margin_cents` is a number
  - seeded roast text appears in some event title/detail
  - PRIVACY: `JSON.stringify(events)` contains none of `secret@private.test`, `from_addr`, `subject`, `buyer_email`
- `tests/feed-route.test.ts` — imports `GET` from `../app/api/feed/route` (module absent → import fails), then asserts `GET()` → 200 JSON with `events[]` + `stats` object.

### RED evidence — `pnpm exec vitest run tests/tools/db-feed.test.ts tests/feed-route.test.ts`

```
 ❯ tests/tools/db-feed.test.ts (5 tests | 5 failed) 1121ms
   × ... > returns an events array and a stats object
     → db: unknown op 'feed'. try: metrics ledger prospects record stage spend revenue pause resume status
   × ... > orders events newest-first (ts descending), each with ts/kind/title
     → db: unknown op 'feed'. ...
   × ... > exposes a numeric stats.margin_cents
     → db: unknown op 'feed'. ...
   × ... > surfaces the seeded roast text in an event title or detail
     → db: unknown op 'feed'. ...
   × ... > never leaks email/PII fields (the page is PUBLIC)
     → db: unknown op 'feed'. ...

 FAIL  tests/feed-route.test.ts [ tests/feed-route.test.ts ]
Error: Cannot find module '../app/api/feed/route' imported from '.../tests/feed-route.test.ts'

 Test Files  2 failed (2)
      Tests  5 failed (5)
```

Both failure reasons are the intended contract gaps: `feed` op not yet in `tools/db.ts` (throws `unknown op 'feed'`), and `app/api/feed/route.ts` does not exist. RED confirmed.

# test-engineer log

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

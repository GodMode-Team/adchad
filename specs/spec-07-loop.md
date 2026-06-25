# Spec 07 — Autonomous loop

**Goal:** Orchestrate the whole P1 spine over N ads, autonomously, respecting the gate + kill-switch, logging a `runs` row.

**Contract** (`lib/loop.ts`)
- `runBatch(n: number): Promise<RunSummary>`
- For each of n ads: `scan` (or read unscored) → `enrich` → `score` → if `gate==='qualify'` and not `paused`: `roast` → `xpost` + `outreachEmail` → record.
- Writes a `runs` row `{ started_at, scanned, enriched, qualified, posted, emailed, revenue, errors_json }`.
- Triggered by `POST /api/run` (the "Run batch" button); optional Vercel Cron.

**Failing test** (`tests/loop.test.ts`, live, no mocks)
1. `runBatch(5)` runs end-to-end against **real** Foreplay + sites + model + X(test) + Resend and returns a summary.
2. Invariant: `posted ≤ qualified ≤ enriched ≤ scanned`; `emailed ≤ qualified`.
3. A `runs` row is persisted and shows on `/audit` (Spec 06).
4. With `paused=true`, `posted === 0` and `emailed === 0`.

**Done when:** one command runs the full scan→enrich→score→roast→post+email spine on live services.

**Deps:** Specs 01–06. This is the P1 integration gate.

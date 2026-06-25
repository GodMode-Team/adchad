# Spec 06 — Audit view + kill-switch

**Goal:** An operator/auditor view — for each X post, show its scores and the reasoning that led to it; real metrics; global kill-switch (NOT an approval gate).

**Contract**
- `/audit` (Next.js) reads the DB: each roast with its `scores` (badness/economic/reachSafety/total/gate) + safety-vote detail + segment, recent orders, metrics = `{ scanned, enriched, qualified, posted, emailed, revenue }`.
- Kill-switch: a `paused` flag (a `control` row). `lib/loop.ts` checks `paused` before every post/email.
- Toggle via `POST /api/control { paused }`.

**Failing test** (`tests/audit.test.ts`, live)
1. After a real run, the `/audit` data endpoint returns counts matching `SELECT count(*)`, and each post row carries its score breakdown + segment.
2. `revenue` equals the sum of paid `orders`.
3. Set `paused=true` → `loop.runBatch()` performs **zero** new X posts/emails; set false → resumes.

**Done when:** the audit trail explains every post (scores + reasoning), numbers match reality, and the kill-switch halts the agent mid-run.

**Deps:** `db.ts`, Spec 07 loop. Blocks: nothing.

# Spec 03 — Scoring + gate

**Goal:** Score an ad on the three weighted axes → total + gate. Badness reuses Iain's `synthcheck`; reachability is email-first.

**Contract** (`lib/score.ts`)
- `score(ad, prospect): Promise<{ badness; economic; reachSafety; total; gate }>`  (each axis 0–100)
- `badness` (35%): run `synthcheck` (simulated buyer cohorts) on the ad → weak reaction = high badness.
- `economic` (30%): "$49/mo-worthy" — high-ticket local-service niche (`niches`) + `running_duration` (long-running = real spender) + $300+ LTV.
- `reachSafety` (35%): **deliverable email** (primary) + active site-linked X (bonus); **and** safe-to-roast — N≥3 real model calls (via the harness) must agree it's fair.
- `total = .35·badness + .30·economic + .35·reachSafety`. `gate`: ≥85 `qualify` · <70 `filter` · else `held`.

**Failing test** (`tests/score.test.ts`, live)
1. A weak ad from a reachable prospect (has email) → `badness` high, `total` 0–100, `gate ∈ {qualify,held,filter}`; safety vote makes ≥3 real model calls.
2. An `unreachable` prospect (no email, no X) → `reachSafety` ≈ 0 → `gate = filter`.
3. A clean/strong ad → `gate ≠ qualify` (never roast a fine business).

**Done when:** scores persisted to `scores`; gate drives the loop.

**Deps:** model endpoint, `synthcheck` skill, enriched prospect (Spec 02). Blocks: 07.

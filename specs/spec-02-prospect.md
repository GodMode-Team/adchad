# Spec 02 — `prospect` skill (find + pick targets)

**Goal:** Teach the agent to hunt across **two modes, ~50/50** (battle plan): **traction** — roast recognizable X brands publicly (punch up, distribution, no sale) — and **revenue** — find weak SMB Meta ads, audit, enrich the owner's contact, and sell the $5 fix. **Decide** who's worth roasting — judgment, not a fixed threshold.

**Deliverable** (`skills/prospect/SKILL.md`)
- **When:** the acquire cron, or "go find someone to roast in <niche>."
- **Procedure:** pick/rotate a niche (from memory — exploit what converts) → `foreplay scan` → for the worst, `enrich` → audit with `synthcheck` (real flaws + buyer-cohort reaction) → **choose** the best target (genuinely bad AND reachable AND not already hit) → record it in `db` as a candidate with reasons + segment.
- **Query = bare niche, never geography.** Foreplay searches ad copy/brand text, not location — `"med spas in Denver, CO"` matches ~nothing. Pass `med spa` / `botox` / `lip filler`, not a city.
- **Empty-result guard (no spiral):** if `foreplay scan` returns zero ads, broaden the query **once** (strip every qualifier → the bare niche) and re-scan. Still empty → record a `note` "no ads found for <niche>", report it, and **STOP**. Never loop debugging an empty scan.
- **Brand-safety gate:** an N≥3 model vote that the roast is fair; a fine business is dropped, never roasted.
- **Output:** a chosen prospect + the named flaws, handed to `roast`.

**Validated when** (Manual QA)
1. `hermes -z "/prospect find a target in med spas"` → returns one real advertiser, its actual ad weaknesses (from `synthcheck`), a contact segment, and *why this one*.
2. Run twice → it doesn't re-pick the same brand (reads memory).
3. Hand it a clean ad → it declines (safety gate), explains why.
4. A niche that returns no ads → it broadens once, then reports "no ads found" and stops (no debug spiral).

**Done when:** the agent autonomously surfaces a defensible, reachable target with real reasons.

**Deps:** [[spec-01-tools]] (foreplay, enrich, db), `synthcheck` skill, memory. Feeds: `roast`.

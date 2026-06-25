# Spec 02 — `prospect` skill (find + pick targets)

**Goal:** Teach the agent to hunt: find weak Meta ads, audit them, enrich the owner's contact, and **decide** who's worth roasting — judgment, not a fixed threshold.

**Deliverable** (`skills/prospect/SKILL.md`)
- **When:** the acquire cron, or "go find someone to roast in <niche>."
- **Procedure:** pick/rotate a niche (from memory — exploit what converts) → `foreplay scan` → for the worst, `enrich` → audit with `synthcheck` (real flaws + buyer-cohort reaction) → **choose** the best target (genuinely bad AND reachable AND not already hit) → record it in `db` as a candidate with reasons + segment.
- **Brand-safety gate:** an N≥3 model vote that the roast is fair; a fine business is dropped, never roasted.
- **Output:** a chosen prospect + the named flaws, handed to `roast`.

**Validated when** (Manual QA)
1. `hermes -z "/prospect find a target in med spas"` → returns one real advertiser, its actual ad weaknesses (from `synthcheck`), a contact segment, and *why this one*.
2. Run twice → it doesn't re-pick the same brand (reads memory).
3. Hand it a clean ad → it declines (safety gate), explains why.

**Done when:** the agent autonomously surfaces a defensible, reachable target with real reasons.

**Deps:** [[spec-01-tools]] (foreplay, enrich, db), `synthcheck` skill, memory. Feeds: `roast`.

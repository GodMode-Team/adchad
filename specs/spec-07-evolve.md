# Spec 07 — `evolve` skill (grow itself)

**Goal:** Give AdChad permission and a routine to make *itself* better — the daily wake-up to improve its skills in service of the $1M-ARR mission.

**Deliverable** (`skills/evolve/SKILL.md`)
- **When:** the evolve cron (`3am daily`), or "improve yourself."
- **Procedure:** review the last day from `db` + memory — which roasts got engagement, which emails got replies, which offers closed, what failed → form one concrete hypothesis (a sharper roast angle, a better subject line, a niche to drop/add) → **edit the relevant `SKILL.md`** (via Hermes `/learn` / skill edit) → log the change + its rationale to memory so `report` can show it.
- **Guardrail:** changes the **skills/playbook only** — never its mission, guardrails, or spend rules. Big swings get proposed to the operator, not self-applied.

**Validated when** (Manual QA)
1. `hermes -z "/evolve"` → it cites real outcomes and proposes one specific, justified skill change.
2. The change lands in the target `SKILL.md` and is logged (visible in the next `/report`).
3. It refuses to alter mission/guardrails on its own.

**Done when:** the agent improves a skill from real results, safely, and shows its work.

**Deps:** [[spec-01-tools]] (db), memory, Hermes `/learn`. Reads outcomes from all skills.

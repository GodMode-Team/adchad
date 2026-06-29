# Spec 05 — `fulfill` skill (do the work)

**Goal:** Deliver the paid product automatically: the $5 single fix, the $12 pack, and the $49/mo membership value — copy + real generated creative + intel.

**Deliverable** (`skills/fulfill/SKILL.md`)
- **Trigger:** a paid Stripe webhook (`stripe webhook` → order row), or "fulfill order <id>."
- **$5 fix:** `copy` skill rewrites headline/body/CTA → `creative` generates a ready-to-run ad image → the worker **replies the fix into the roast thread on X** (email fallback when there's no X roast tweet or the kill-switch is paused) → mark `fixes` + order fulfilled.
- **$12 pack:** three creative variants to A/B.
- **$49/mo membership:** weekly fresh creatives + a competitor-intel report (via `intel`/`synthcheck`); schedule the recurring delivery.
- **Ledger:** record revenue in + tool cost out (`db ledger`) so `report` has real margins.

**Validated when** (Manual QA / live)
1. Fire a real test-mode `checkout.session.completed` → a `fixes` row with non-empty copy **and** a real `image_url`; the fix lands as a real **public X reply** in the roast thread (or, with no X roast tweet / paused, a real Resend email with the image).
2. The order is marked fulfilled and the ledger shows the revenue + the gen cost.
3. A $49 signup schedules the first weekly delivery.

**Done when:** paying auto-delivers a runnable creative with no human step, and the P&L updates.

**Deps:** [[spec-01-tools]] (stripe, creative, email, db), `copy` + `synthcheck` skills. Feeds: `report`.

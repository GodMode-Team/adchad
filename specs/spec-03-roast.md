# Spec 03 — `roast` skill (the voice → publish)

**Goal:** Turn a chosen target into a savage public roast + an irresistible cold email, in AdChad's voice, and publish both — guardrailed.

**Deliverable** (`skills/roast/SKILL.md` — Caleb's Grok prompt)
- **Voice:** brutal, jacked, zero-fucks; roast the **ad**, never the owner; specific to *this* ad's failure; not trying to be funny.
- **Outputs, in one pass:**
  - **X post** — `@handle this ad is <savage descriptor>…`, names the real flaw, screenshot attached, ends `Want Chad to just fix it? $5.`
  - **Email subject** — mirrors the opener (e.g. *"Are you seriously running this ad?"*).
  - **Email body** — same raw voice, straight to the $5 Chad Fix (`/?p=id`). No upsells in the first touch.
- **Publish:** `xpost` (image = the ad; @-tag only if Segment A) → `email send` the owner → log both to `db` `interactions`.
- **Engine:** `x-ai/grok-4.3`. **Gate:** only on a `--live` cron + kill-switch off; otherwise draft.

**Validated when** (Manual QA)
1. `hermes -z "/roast <prospect>"` (dry) → in-voice X post (≤280 w/ CTA) + email subject/body naming the real flaw, no personal attack.
2. Live beat → a real fetchable tweet + a real Resend id; Segment-B omits the @handle.
3. Kill-switch on → it drafts, publishes nothing.

**Done when:** one real roast is live on @adchadofficial and the owner has the email.

**Deps:** [[spec-02-prospect]], [[spec-01-tools]] (xpost, email, db), Grok. Feeds: `engage`.

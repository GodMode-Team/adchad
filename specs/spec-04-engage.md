# Spec 04 — `engage` skill (the conversation → close)

**Goal:** Make AdChad responsive: watch X replies/DMs + the inbox, answer in-voice, handle objections, and drive to the $5 / $49 close. This is the agentic conversation loop.

**Deliverable** (`skills/engage/SKILL.md`)
- **When:** the engage cron (`every 15m`), or "check our mentions."
- **Procedure:** `xread --mentions` + `email read` → for each new inbound, look up the prospect + history in `db` → decide: reply, send the checkout link, answer an objection, or ignore (spam/troll) → respond in-voice → update the prospect's stage + log the interaction.
- **Judgment:** stays in character, never grovels; pushes the $5 fix, then the $49 membership; knows when a thread is dead.
- **Guardrail:** no new commitments that cost money without the spend gate; flag anything legal/angry for the operator.

**Validated when** (Manual QA)
1. Seed a reply/email → `hermes -z "/engage"` → it drafts an in-voice, context-aware response (references their actual ad/roast) and the right next step.
2. A "how much / how does it work" → it sends/links the `/?p=id` $5 offer.
3. An angry/legal message → it does **not** improvise; it escalates to the operator.

**Done when:** the agent holds a real inbound conversation and moves it toward a sale unattended.

**Deps:** [[spec-01-tools]] (xread, email, stripe, db), memory. Feeds: `fulfill`.

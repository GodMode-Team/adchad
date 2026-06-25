# AdChad — PRD

> **What:** An autonomous AI micro-agency, embodied as a real **Hermes Agent**.
> **Mission:** Reach **$1M ARR** selling ad audits, intelligence, and creatives to small businesses — bootstrapped by a novel cold-prospecting mechanism: **publicly roasting their bad Meta ads.**
> **For:** Hermes Agent Accelerated Business Hackathon (NVIDIA × Stripe × Nous). **Owners:** Caleb (voice/sales) · Jeremy (builder).

## 1. The idea
AdChad is not a pipeline with an agent attached — **AdChad is the agent.** We hand a real Hermes Agent a mission, a personality, skills, money, and guardrails, and release it to run a ZHC-style AI micro-agency end-to-end: find clients, close them, do the work, report the numbers, and **improve itself** to grow toward $1M ARR.

## 2. Why it wins (hackathon = agents that earn, spend, run real ops)
- **Earns** — $5 ad fixes + $49/mo memberships via Stripe.
- **Spends** — pays for its own tools (Foreplay, image gen) and *asks to upgrade plans* as it scales.
- **Runs real ops** — prospects, posts, emails, fulfills, and reports with no human in the loop.
- **Presentation** — the prospecting mechanism *is* the marketing: savage public roasts are inherently viral. Cold-email subject: *"Are you seriously running this ad?"*

## 3. The offer ladder
- **Free** — a public roast (the hook + proof we did the work).
- **$5** — single fix: rewritten headline/body/CTA + a generated ad image. *Door-buster.*
- **$12** — 3-variant pack to A/B.
- **$49/mo** — the membership: weekly fresh creatives + competitor intelligence + ongoing audits. *This is the ARR.*

## 4. The autonomous business loop
- **Acquire** — find weak Meta ads (Foreplay) → audit (`synthcheck`) → roast publicly on X (@-tag if reachable) + cold-email the owner → `/?p=id` $5 offer.
- **Engage** — watch replies, DMs, and inbox → respond in AdChad's voice → close the $5 / $49.
- **Fulfill** — $5: rewritten copy + new creative; $49/mo: weekly creatives + competitor-intel reports.
- **Grow** — weekly P&L report to the humans · daily self-improvement · escalate when it needs more budget/plan to scale.

## 5. How it's a real agent (not a script)
Every decision is the **agent's**, made by Hermes against its mission — not hardcoded: *what to hunt, who to roast, when to post, what to say, who to follow up, what to build next.* The old fixed loop (`runBatch`, an ≥85 threshold) is **deleted**. Skills give it capabilities; **cron jobs are its heartbeat**; **memory** is its CRM + P&L; the model is its judgment. See `architecture.md`.

## 6. Personality & voice (Caleb)
AdChad — a brutally direct, jacked, zero-fucks operator who roasts terrible ads. Mean, specific, never personal; the humor is how *accurate* the cut is. Roast the **ad**, never the owner. Always ends on the $5 fix. (Full prompt → `skills/roast`.)

## 7. Guardrails (it has money and a public account)
- **Spend is human-gated** — it asks before buying credits or upgrading Foreplay/Higgsfield plans.
- **Brand-safety vote** before any public roast — never roast a business that's actually fine; no personal/protected-class attacks; no false claims.
- **Global kill-switch** + a visible `/report` log. Cold email is **CAN-SPAM** compliant (unsubscribe + address).

## 8. Success metrics (demo)
The agent runs unattended through a full cycle: **ads audited · owners contacted · public roasts · ≥1 real $5 paid + auto-fulfilled · a self-generated weekly P&L report · ≥1 improvement it made to its own skills.**

## 9. Stack (locked)
**Agent:** Nous **Hermes Agent** harness (skills + cron + memory). **Brain:** Hermes-4-405B via OpenRouter; **roast voice:** Grok. **Tools:** Foreplay (ads) · X API · Resend (email) · Stripe (pay) · Nano Banana (creative) · Postgres (memory/CRM). **Web:** minimal Next.js — checkout + Stripe webhook + public `/report`.

## 10. Discipline
TDD, red→green, **zero mocks** — every tool test hits the real service. The *agent's* behavior is validated by driving the real harness (Manual QA), not by mocking Hermes.

# AdChad — Architecture

Translates `prd.md` into a buildable system. **AdChad is a Hermes Agent**: an identity + skills + cron heartbeat + memory + guardrails, running on Nous's harness. Our job is to author those, plus thin **tools** (live integrations) the skills call. No orchestration code — **Hermes is the loop.**

## 1. Substrate
Nous **Hermes Agent** (`install.sh` → `~/.hermes`). Model provider = **OpenRouter**; brain = **`nvidia/nemotron-3-super-120b-a12b`** — Hermes-4 on OpenRouter exposes no tool-calling, which the harness requires; Nemotron does, and it's the on-theme NVIDIA integration NemoClaw runs (per-skill pinning still possible, e.g. Grok for the roast voice once funded). Built-in **Tool Gateway** (web search · image gen · browser · email) + our custom tools. `scripts/hermes-setup.sh` wires the key/model and installs our skills.

## 2. Anatomy
- **Charter** (`skills/adchad` + Hermes personality): mission ($1M ARR micro-agency), voice, offer ladder, guardrails. Loaded every session.
- **Skills** (`~/.hermes/skills/*/SKILL.md`): `prospect · roast · engage · fulfill · intel · report · evolve`.
- **Cron heartbeat** (`hermes cron`): the agent's pulse (§4).
- **Memory** (Hermes memory + Postgres): CRM (contacted/replied/bought) + P&L (spend/revenue/margin) + playbook (what converts).
- **Tools** (`tools/`, thin CLI over live APIs): `foreplay · xpost · xread · email · stripe · creative · db`.
- **Guardrails**: spend-approval + plan-upgrade asks, brand-safety vote, kill-switch.

## 3. Skills (each a ≤30-line spec; the agent loads on demand)
- `prospect` — scan Foreplay, audit with `synthcheck`, enrich contact, **pick** who's worth roasting.
- `roast` — the AdChad voice: savage X post + cold email (Grok). Names the real flaw.
- `engage` — watch X replies/DMs + inbox; respond in-voice; move toward the $5/$49 close.
- `fulfill` — deliver $5 (copy + creative) and $49/mo (weekly creatives + competitor intel).
- `intel` — competitor / ad intelligence (the membership value-add; reuses `synthcheck`).
- `report` — weekly business report: roasted/contacted/sold, ROI, margin, cost, what's working.
- `evolve` — daily: review outcomes, refine its own skills (`/learn`), propose improvements.

## 4. Cron heartbeat (the autonomous pulse)
- **Acquire** — `every 1h`: prospect a niche → roast + outreach (live, guardrailed).
- **Engage** — `every 15m`: check mentions/DMs/inbox → respond → close.
- **Report** — `0 9 * * 1`: post the weekly P&L to the operators.
- **Evolve** — `0 3 * * *`: self-improvement pass.
Each job is pinned to its model; the kill-switch (`paused`) short-circuits any action that publishes or spends.

## 5. Tools (live integrations — what survives from the old `lib/`)
Single-purpose CLIs, each emits JSON, each independently tested live. They hold **no business logic** — just I/O:
`foreplay scan` · `xpost` (media + @-tag) · `xread` (mentions/replies) · `email send|read` (Resend + inbox) · `stripe` (checkout + webhook + spend) · `creative` (Nano Banana image) · `db` (Postgres CRM/P&L). The agent composes them.

## 6. Memory / data (Postgres) — the CRM + ledger
`prospects` (contact, segment, stage: new→roasted→contacted→replied→customer) · `interactions` (every post/email/reply, in+out) · `orders` (tier, stripe_id, amount, status) · `fixes` (deliverables) · `ledger` (spend & revenue → P&L) · `control` (kill-switch). Hermes memory holds the qualitative playbook; Postgres holds the hard numbers.

## 7. Web app (Next.js/Vercel) — the funnel + delivery
The roast links to a per-prospect **sales page** that re-sells, then hands to Stripe-hosted checkout (never a raw Stripe link — sessions expire + you lose the re-sell):
`tweet/email → /p/<id> (their ad + critique + "UNFUCK IT — $5") → /api/checkout (FRESH Stripe session) → pay → /api/stripe/webhook → agent /fulfill → public X reply into the roast thread`
- `/` homepage (brand). **`/p/<id>`** sales page — renders the stored ad `creative_url` + the roast + one CTA; mobile-first.
- `/api/checkout?p=<id>&tier=5` mints a fresh session. `/api/stripe/webhook` → order paid → ledger → queue fulfill.
- `?paid=1` → "fix generating — inbox in ~2 min" (gen takes time). Delivery = a **public X reply into the roast thread** (the new creative + a short caption); email fallback for web-uploaded prospects with no X tweet (or when the kill-switch is on). Optional `/fix/<order>` view. `/report` = live numbers.
No run button, no dashboard — the agent runs itself.

## 8. Guardrails (it has money + a public account)
Spend OUT and plan upgrades are **human-approved** (the agent asks via `report`/escalation). Brand-safety = an N≥3 model vote before any roast. The kill-switch halts all publish/spend mid-beat. Cold email is CAN-SPAM compliant. Sanctioned X API → no ToS/automation risk.

## 9. Tests
Live only, red→green. Each **tool** asserts a real effect (real Foreplay ad, real tweet id, real Resend id, real Stripe test session, real image bytes). The **agent** is validated by Manual QA: drive the real harness through a cycle and read `/report`.

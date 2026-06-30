# AdChad

AdChad is an autonomous AI micro-agency — and it **is a real Hermes Agent**, not a pipeline with an agent bolted on. We hand the agent a mission, a voice, skills, money, and guardrails, then let it run a ZHC-style ad agency end to end: find weak Meta ads, **publicly roast** them, close the owner on a **$5 fix**, deliver it, report the P&L, and improve itself toward **$1M ARR**.

Built for the **Hermes Agent Accelerated Business Hackathon** (NVIDIA × Stripe × Nous).

**Depth lives elsewhere:** `architecture.md` (how it's built) · `specs/` (per-skill specs).

## What AdChad is

A Hermes Agent = identity + skills + a heartbeat + memory + guardrails. There is no orchestration code — **Hermes is the loop.**

- **Charter** (`skills/adchad/SKILL.md`) — mission, voice, offer ladder, operating rules. Loaded every session, so a fresh Hermes session *is* AdChad.
- **7 skills** (`skills/`) — `prospect` (find + audit + pick a target) · `roast` (savage X post + cold email) · `engage` (work replies/DMs/inbox toward the close) · `fulfill` (deliver paid work) · `report` (weekly P&L) · `evolve` (improve its own skills). Plus shared `synthcheck` + `copy`.
- **Cron heartbeat** — the autonomous pulse: **acquire** `every 1h` · **engage** `every 15m` · **report** `Mon 9am` · **evolve** `3am`.
- **Memory** — Hermes memory holds the qualitative playbook; Postgres holds the hard numbers (CRM + P&L ledger).
- **Guardrails** — a global **kill-switch**, **spend-approval** (it asks before buying or upgrading a plan), and a **brand-safety vote** before any public roast.

**Brain:** NVIDIA **Nemotron** via OpenRouter. The harness is named for *Hermes the harness*, not the model — Hermes-4 on OpenRouter lacks the tool-calling the harness requires, so the agent runs on Nemotron (tool-capable, and the on-theme NVIDIA integration).

## The tools (its hands)

Thin single-purpose CLIs over live APIs — no business logic, just I/O. The agent composes them:

```
pnpm -s tool <foreplay|enrich|xpost|xread|email|creative|stripe|db> [sub] [--flag value]
```

`foreplay` scan Meta ads · `enrich` ad → owner contact · `xpost`/`xread` the AdChad X account · `email` send/read (Resend) · `creative` generate an ad image · `stripe` checkout · `db` the Postgres CRM + ledger. Each emits one JSON line; each is tested live (`tests/tools/`).

## The funnel (the money loop)

```
tweet / cold email  →  /p/<id> sales page ("UNFUCK IT — $5")  →  /api/checkout (fresh Stripe session)
   →  pay  →  /api/stripe/webhook (records the order + revenue, queues a fulfill)  →  agent /fulfill  →  fixed-ad email
```

Every click mints a fresh Stripe Checkout session (never a raw payment link — those expire and you lose the re-sell). `/report` shows the live funnel + P&L. The web app (`app/`) is deliberately thin — sales page, checkout, webhook, report — because the agent runs itself; there's no dashboard.

## Runtime

Local now (Hermes CLI + `pnpm dev` for the web app). Target: **NemoClaw** (NVIDIA's OpenShell sandbox) later.

## Run it

1. **Keys** — copy `.env.example` → `.env.local` and fill it in, then `pnpm tsx scripts/validate-keys.ts` to see what's SET vs MISSING.
2. **Migrate** — `pnpm migrate` (applies `db/schema.sql` to Postgres).
3. **Install Hermes** — `curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash`
4. **Wire AdChad onto it** — `bash scripts/hermes-setup.sh` (points Hermes at OpenRouter/Nemotron, installs the skills, prints the cron heartbeat, and starts the kill-switch **ON**). Then `hermes -z "who are you?"`.
5. **Web app** — `pnpm dev` (`/` brand · `/p/<id>` sales page · `/report` live numbers).
6. **Test** — `pnpm test` (live suite, **zero mocks** — hits real Foreplay / model / X / Resend / Stripe-test).
7. **Go live / stop** — `pnpm -s tool db resume` (publish for real) · `pnpm -s tool db pause` (halt all publish + spend).

## Status

**Done** — the charter + 7 skills + cron wiring (`hermes-setup.sh`); all 8 tools live and tested; the full funnel (`/p/<id>` → checkout → webhook → fulfill → `/report`); Postgres schema migrated; providers provisioned (Foreplay · Neon · OpenRouter · X · Resend · Brave).

**Left to finish** — install + wire Hermes once (`scripts/hermes-setup.sh`) · add Stripe **test keys** to close the $5 loop · one real unattended demo cycle (needs an explicit go) · deploy (Vercel) · record + submit the demo video.

# AdChad

An autonomous AI ad agency: scans live Meta ads, scores + **roasts** the weak ones on X, and sells a **$5 AI fix** (rewritten copy + a generated ad image). Built for the **Hermes Agent Accelerated Business Hackathon** (NVIDIA × Stripe × Nous) — submission due **Tue Jun 30** (internal target Fri Jun 26).

**Planning docs:** `prd.md` · `architecture.md` · `specs/` · `hermes-briefing.md` · `bookmarks-intel.md` · `PROVISION.md`

---

## ✅ Done — all live, no mocks (`pnpm test` runs the real suite)
- [x] **Scaffold** — Next.js + TS + Vitest + Neon Postgres (schema migrated)
- [x] **01 scan** — Foreplay → `ads` / `prospects`
- [x] **02 enrich** — site → email + site-linked X handle + segment (~67% reach; Brave name→website search)
- [x] **03 score** — Hermes-4 badness + economic + 3-vote safety gate (≥85 qualifies)
- [x] **04 roast** — real public post from **@adchadofficial** + real **outreach email** (Resend, `send.adchad.ai` verified)
- [x] **05 fulfill (core)** — `copy` rewrite **+ generated ad image** (Nano Banana). *Checkout not wired yet — see below.*
- [x] **06 audit** — operator dashboard + kill-switch (`/audit`)
- [x] **07 loop** — autonomous scan→enrich→score→roast→post→email (`runBatch`, with `dryRun` + kill-switch). The deterministic engine.
- [x] **08 creative** — AI ad image via OpenRouter
- [x] ⭐ **Hermes Agent harness** — runs ON Nous's harness: `skills/adchad/SKILL.md` (operator) + `scripts/run-once.ts` (headless entry) + `scripts/hermes-setup.sh` (wires OpenRouter + installs skills + prints cron). Hermes-4-405B is the operator; cron makes it autonomous. *You still run `install.sh` + `hermes-setup.sh` once — see PROVISION §6.*
- [x] **Provisioned** — Foreplay · Neon · OpenRouter · X API (funded) · Resend (domain verified) · Brave

## ⏳ Left to finish (in priority order)
- [ ] **Install + wire Hermes** *(one-time, ~5 min)* — `curl install.sh` then `bash scripts/hermes-setup.sh`, then `hermes -z "/adchad preview a cycle for med spas"`. Build is done (above); this is the run step. **PROVISION §6.**
- [ ] **Stripe $5 checkout** *(finishes 05)* — needs Stripe **test keys** → `/api/checkout` → webhook → `fulfill()` → email. **Judged criterion (revenue).**
- [ ] **Swap roast engine to Grok** — paste Caleb's extracted prompt into `skills/roast/SKILL.md`, set `MODEL_ROAST=x-ai/grok-4.3`, re-run `scripts/roast-bakeoff.ts`
- [ ] **One real demo run** — flip the loop to `dryRun:false` (real public roasts + real emails) — **needs Jeremy's explicit go**
- [ ] **Roast card** — the bold `/?p=` mockup wired to real data (currently a placeholder landing) — *build when you're ready*
- [ ] **Deploy** — Vercel (a free `*.vercel.app` is fine; `adchad.ai` domain optional/last)
- [ ] **Submit** — 1–3 min demo video tagging **@NousResearch** + writeup → Discord + Typeform
- [ ] **Security** — rotate the Foreplay key + scrub `.env.local` from the **Initial commit** (it's in GitHub history)

## Optional / stretch
- [ ] $12 + $49/mo tiers · spend-loop (agent buys its own credits) · feedback loop · competitor monitoring · NemoClaw harness wrap

---

## Critical path to "done"
1. **Stripe keys** → finish the $5 money loop
2. **Caleb's Grok prompt** → swap the roast engine
3. **One real run** → capture real roasts + email + a $5 payment
4. **Deploy + record the video** → submit

## Run it
- `pnpm test` — full live suite (hits real Foreplay / model / X / Resend)
- `pnpm dev` — app (`/`, `/audit`)
- `pnpm migrate` — apply `db/schema.sql` to Neon
- Keys live in `.env.local` (template: `.env.example`; how-to: `PROVISION.md`)
- `lib/` = the agent (scan · enrich · score · roast · fulfill · creative · xpost · email · loop) · `skills/` = `SKILL.md` files (synthcheck · copy · roast)

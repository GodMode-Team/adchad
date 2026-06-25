# AdChad — Provisioning checklist (Thu Jun 25)

Put real values into `.env.local` (gitignored). Only the 🔴 items need you.

## Status
| Item | Who | Status |
|------|-----|--------|
| Foreplay API | you | ✅ verified live |
| Postgres (Neon) | you | ✅ verified — schema migrated |
| npm deps + scaffold | me | ✅ done |
| OpenRouter (models) | you | ✅ verified — Hermes-4-405b responding |
| X API | you | ✅ live — posts as @adchadofficial (funded) |
| Resend (email) | you | ✅ verified — `send.adchad.ai` domain |
| Brave Search (booster) | you | ✅ key in |
| **Stripe (payments)** | you | 🔴 **test keys needed** — the $5 money loop (§4) |
| MAILING_ADDRESS (CAN-SPAM) | you | 🔴 one line — a valid postal address for the cold-email footer |
| **Hermes Agent (harness)** | you | 🔴 **install + `bash scripts/hermes-setup.sh`** (§6 — AdChad runs ON Nous's harness) |
| Nous Portal | you | ⚪ optional (OpenRouter covers the model; Portal only adds Tool Gateway) |

---

## 1. OpenRouter — `OPENROUTER_API_KEY`  (≈3 min · do first — gates the models)
One key gives us Hermes-4-405B + Nemotron + Grok — no separate xAI/NVIDIA accounts.
1. **https://openrouter.ai** → Sign in (Google/GitHub/email).
2. Add credit: avatar (top-right) → **Credits** → add **$10** (plenty; calls are cheap).
3. **https://openrouter.ai/keys** → **Create Key** → name `adchad` → **Create**.
4. Copy (`sk-or-v1-…`) → in `.env.local`: `OPENROUTER_API_KEY=sk-or-v1-…`

## 2. X API — 4 tokens, created UNDER @adchadofficial  (≈8 min)
(The earlier paste failed "Invalid consumer tokens." Cleanest fix: give @adchadofficial its own app so posts come from it.)
1. Logged in as **@adchadofficial** → **https://developer.x.com** → sign up for **Free** developer access ("post AI critiques of ads").
2. Project's App → **Settings → User authentication settings → Set up**:
   - **App permissions: Read and Write** ← required to post (the #1 gotcha).
   - Type: Web App; any URL (e.g. `https://adchad.ai`) for callback + website. Save.
3. **Keys and tokens** tab:
   - **API Key & Secret** → `X_API_KEY` / `X_API_SECRET`
   - **Access Token & Secret** → **Generate** → `X_ACCESS_TOKEN` / `X_ACCESS_SECRET`
   - ⚠️ Access Token must show **Read and Write**. If you set permissions *after* generating, **Regenerate** it.
4. Replace the 4 X values in `.env.local`. The validator prints the handle so we confirm it says **@adchadofficial**.

## 3. Resend — `RESEND_API_KEY`  (≈3 min)
1. **https://resend.com** → sign up.
2. **https://resend.com/api-keys** → **Create API Key** → name `adchad`, **Sending access** → **Create**.
3. Copy (`re_…`) → `.env.local`: `RESEND_API_KEY=re_…`
4. (Can wait) To email real owners from `@adchad.ai`: **https://resend.com/domains** → Add domain → add the DNS records shown. Until then we test from `onboarding@resend.dev` to your own inbox — leave `RESEND_FROM` as is.

## 4. Stripe — `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`  (≈5 min · 🔴 NOW — gates the $5 money loop)
1. **https://dashboard.stripe.com/register** → create account (skip business details for test mode).
2. Confirm **Test mode** (top-right toggle).
3. **https://dashboard.stripe.com/test/apikeys** → copy **Secret key** (`sk_test_…`) → `STRIPE_SECRET_KEY=…`; copy **Publishable key** (`pk_test_…`) → `STRIPE_PUBLISHABLE_KEY=…`
4. Terminal: **`stripe login`** → approve in browser (lets me wire the Spec 05 webhook + `STRIPE_WEBHOOK_SECRET`).

## 5. (Optional booster) Brave Search — `BRAVE_API_KEY`
Lifts enrichment hit-rate on ads that link to a bare `fb.me` (no website to scrape). Implements Caleb's "biz name → website."
1. **https://api-dashboard.search.brave.com** → sign up → subscribe to the **Free** plan (2,000 queries/mo, card may be required, $0).
2. Create a subscription token → `.env.local`: `BRAVE_API_KEY=…`
(Without it we skip name-search and rely on the ad's own link — that already hits ~67% on real verticals.)

## ⚠️ X account note (important)
Posting uses whatever account the **Access Token** belongs to. If Caleb generated it from *his* X app/account, roasts will
post from **his** handle, not AdChad. Once the AdChad account exists: in the X developer portal, (re)generate the
**Access Token + Secret while authorized as @adchad**, and repaste `X_ACCESS_TOKEN` / `X_ACCESS_SECRET`. The validator prints
the current handle so we can confirm.

## 6. Hermes Agent — AdChad runs ON the harness  (≈5 min · THE on-theme part)
AdChad *is* a Hermes Agent: a charter + 7 skills + a cron heartbeat. `scripts/hermes-setup.sh` does all the wiring — you just install Hermes and run it. (Model = Hermes-4-405B via OpenRouter, already set; no extra account.)
1. **Install Hermes** (macOS/Linux): `curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash`
   - Skip `hermes setup --portal` — OpenRouter is the brain. Portal only adds optional Tool-Gateway extras.
2. **Wire it** (from the repo): `bash scripts/hermes-setup.sh`
   - Points Hermes at OpenRouter (brain = Hermes-4-405B), installs every skill (adchad · prospect · roast · engage · fulfill · report · evolve + synthcheck · copy) into `~/.hermes/skills/`, and **starts the kill-switch ON** (it drafts but publishes nothing). Idempotent.
3. **Meet it** (safe): `hermes -z "who are you and what's your mission?"` → then `hermes -z "/prospect find a target in med spas"`.
4. **Register the heartbeat** (the script prints these): acquire `every 1h` · engage `every 15m` · report `Mon 9am` · evolve `3am` → `hermes gateway start` (ticks every 60s).
5. **Go live** when you're ready: `pnpm -s tool db resume` (kill-switch off → it publishes for real). Stop anytime: `pnpm -s tool db pause`.

> Config lands in `~/.hermes/config.yaml` (model) + `~/.hermes/.env` (key). Nothing posts publicly until you `db resume`.

---
**What I still need from you:** ① install Hermes + `bash scripts/hermes-setup.sh` (§6) · ② Stripe **test keys** (§4) · ③ one `MAILING_ADDRESS` line. Everything else is in. ✅

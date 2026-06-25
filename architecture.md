# AdChad — Architecture

Translates `prd.md` into a buildable system. **All TypeScript + markdown skills — no Python** (§3). Kept ≤73 lines on purpose.

## 1. Shape
The public roast lives on **X**. The web app is the conversion + control layer. One agent loop · one Next.js app · one Postgres.
`Hermes Agent harness (loop + skills)  ⇄  Postgres/Neon  ⇄  Next.js app on Vercel` — externals: Foreplay · model endpoint (Nemotron/Grok/Hermes-4) · Stripe · X · Resend.

## 2. The loop (two outreach channels: viral X roast + owner email)
`foreplay.scan → enrich(site→email+X) → synthcheck/score+gate(≥85) → roast(model) → POST TO X (@-tag if A) + email the OWNER (value-first offer) → owner clicks /?p=id → $5 Stripe → copy(fix) + creative(image) → email the BUYER`
Fully autonomous. The **safety score** (not a human) is the publish/skip guard; `/audit` = live feed + kill-switch.
**X roast = virality; owner email = conversion** (most local SMBs have no active X). A 2nd email delivers the paid fix to buyers.

## 3. Why all TypeScript, no Python
(1) Inference is a hosted OpenAI-compatible HTTP API (build.nvidia / OpenRouter / Nous Portal / xAI) — we orchestrate, we don't serve a model.
(2) Hermes Agent skills are **markdown** (`SKILL.md` in `~/.hermes/skills`), not code. Python is only for self-hosting models / Python-only SDKs — neither applies.

## 4. Reuse Iain's Paid Ads Suite  (GodMode-Team/patientautopilot · format hermes-skill-bundle-portable)
- `synthcheck` → badness / creative score (simulated buyer cohorts). **= our scorer, already built.**
- `copy` → the $5 fix, $12 variants, 3-min VSL. **already built.**
- `paid-ads-account-watchdogs` → the $49/mo competitor monitoring. `meta-ad-ops` → Meta context.
- We add ONE new skill: **`roast`** — the AdChad mean-but-useful voice (the team tunes the voice).
- **How a TS fn "uses" a skill:** load the skill's `SKILL.md` as the model's instruction prompt + pass the ad/order as input. Vendor `synthcheck`/`copy`/`roast` into `skills/`.

## 5. Our new code (lib/, plain TS — runs in the harness OR a thin loop, so §12-PRD's choice never forces a rewrite)
`foreplay.ts` import · `enrich.ts` (site→email+X+segment) · `score.ts` (synthcheck + economic + reach/safety → gate) ·
`roast.ts` (model) · `xpost.ts` (X, @-tag if A) · `email.ts` (Resend: outreach + fulfillment) · `fulfill.ts` (copy) · `creative.ts` (image gen) ·
`loop.ts` orchestrate · `model.ts` (endpoint client) · `db.ts`.

## 6. Data model (Postgres/Neon) — flat tables
- `ads` foreplay_id, advertiser, handle, creative_url, copy, format, first_seen, raw_json
- `prospects` name, website, email, x_handle, x_followers, segment(A/B/unreachable), vertical, est_spend, ltv_est, status
- `scores` ad_id, badness, economic, reach_safety, total, gate, votes_json
- `roasts` prospect_id, ad_id, text, hook, model, status, post_url, sent_at
- `orders` prospect_id, tier(5/12/49), stripe_id, buyer_email, amount, status, created_at
- `fixes` order_id, headline, body, cta, creative_dir, image_url, variants_json, delivered_at
- `runs` started_at, scanned, enriched, qualified, posted, emailed, revenue, errors_json · `control` paused(bool) — kill-switch

## 7. Web app (Next.js/Vercel) — kept minimal: purchase + VSL + audit
`/` sales + VSL + $5/$12/$49 checkout (prospect arrives via `?p=<id>` from the X roast link — **no per-prospect page**) ·
`/audit` operator log: each X post + its scores + the reasoning that led to it · kill-switch · metrics ·
`/api/{run, checkout, stripe/webhook}`.

## 8. Models — Hermes Agent is the HARNESS (model-agnostic); the model is our free, per-skill choice
The harness (on-theme foundation) points at any OpenAI-compatible endpoint, swappable per skill. Plan: **Nemotron 3 Super**
(NemoClaw default, cheap, NVIDIA-friendly) for high-volume scoring; **roaster = Day-1 bake-off** among **Grok · Hermes-4-405B ·
Nemotron** on 5 real bad ads. Grok is fully on-theme here (the harness is Hermes, not the model). See `hermes-briefing.md`.

## 9. X posting (official X API — the team provided a key)
Post via the **official X API v2** using the `twitter-api-v2` Node SDK: media upload + create tweet, @-tag if Segment A.
Write needs **user-context** auth (OAuth 1.0a: `X_API_KEY`/`X_API_SECRET`/`X_ACCESS_TOKEN`/`X_ACCESS_SECRET`, or an OAuth2
user token). Sanctioned access → no automation-flag/ToS/ban risk. (The old cookie-session approach is dropped.)

## 10. Keys to provision Thursday AM
Foreplay ✅ · Postgres (Neon) ✅ · **OpenRouter** (Hermes-4 + Nemotron + Grok bake-off **+ Nano Banana images**) · **X API** (the team ✅ — needs credits) · Stripe (test) · **Resend + verified sending domain (SPF/DKIM — DNS lags)**.

## 11. Build order → specs (each a ≤30-line TDD contract; live, no mocks)
P1: `01-foreplay` · `02-enrich` · `03-score` (synthcheck) · `04-roast-post` (X + owner email) · `05-checkout-fulfill` · `06-audit` · `07-loop`.
P2 `08-creative` (image fix) · `09-orderbump` · P3 `10-subscription` (watchdogs) · P4 `11-spend-loop` + feedback loop (+ Nemotron / NemoClaw / VSL).

## 12. Tests
Live only. Foreplay + real site fetches (enrich); the model asserts real non-empty on-voice output; X-post asserts a real
tweet id; Resend asserts a real message id; Stripe test-mode E2E through the webhook + one **live** $5 for the demo. Red→green per spec.

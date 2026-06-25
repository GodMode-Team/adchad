# AdChad — PRD

> **Tagline:** "An AI ad agency that prospects for itself."
> **For:** Hermes Agent Accelerated Business Hackathon (NVIDIA × Stripe × Nous Research).
> **Owners:** Caleb (idea/voice/sales input) · Jeremy (builder).
> **Planning:** Wed Jun 24 night (1-hr timebox). **Build:** Thu Jun 25. **Done + submit:** Fri Jun 26, 5pm hard-stop.
> **Official deadline:** EOD Tue Jun 30 (we ignore the buffer — done Friday).

## 1. What it is
An autonomous agent — a Hermes-Agent-style loop of **skills** (scan · score · roast · fix), a batch **routine**, and a
**feedback signal** — that finds SMBs running weak Meta ads, publicly **roasts** them (savage but genuinely useful), and
converts the roast into a paid fix (a **real rewritten ad + generated creative**) through a tiered funnel. The agent runs
on its own; the only human-gated action is the agent *spending* money (P4).

## 2. Hackathon fit (this is the scoring rubric)
Judged on **usefulness · viability · presentation** by Nous + NVIDIA + Stripe. Theme = agents that **earn, spend,
and run real operations**. AdChad hits all three: it **earns** (Stripe roast-fix revenue), **spends** (pays Foreplay
per-call via the Stripe skill — stretch), and **runs real operations** (the autonomous scan→roast→fulfill loop).
Presentation is 1/3 — the roast angle is inherently viral, and the demo video is a first-class deliverable.

## 3. ICP (qualify gate)
Owner-led SMB · **$1k–$30k/mo Meta spend** · sells **$300+ LTV** offer · reachable by **email** (primary) or active X (bonus) · creatively weak ads.
Target verticals: med spa, HVAC, dental, fitness.

## 4. The funnel (all in scope — built in dependency order, see §7)
- **Free** — public roast (diagnosis + hook suggestion).
- **$5** — single ad fix: rewritten headline/body/CTA + **a generated static ad image** to run. *Door-buster.*
- **$12** — three-variant pack: 3 generated ad images to A/B (order bump).
- **$49/mo** — weekly creative subscription + competitor monitoring. *This is the business.*

## 5. Prospect scoring (the publish/skip decision)
Weighted, gated. Score 0–100:
- **Badness / creative quality — 35%** (vague hook, weak CTA, bad offer).
- **Economic viability — 30%** (vertical value, ad frequency/spend, conversion potential, $300+ LTV).
- **Reachability + safety — 35%** (**deliverable email** primary + active site-linked X bonus **and** safe-to-roast / brand-safety guard).

**≥ 85 → qualifies (posted). < 70 → filtered. 70–84 → held (not posted, no human).**
Safety is a *gate, not a tiebreaker* — a self-consistency vote here is the **autonomous** publish/skip guard (no human in
the loop; see §6). It stops AdChad ever roasting a business that's actually fine.

## 6. The autonomous loop
`Foreplay scan → enrich → score (≥85 gate) → roast → AUTO-POST to X (@-tag if A) + email the owner (offer, /?p=id) → $5 Stripe checkout → run fix → email the buyer`
Runs **fully autonomous** — the safety score (§5), not a human, decides publish/skip. The `/audit` view gives a live
feed + a **global kill-switch**, but it is not a mandatory gate. (Customer payments IN are automatic;
the only human-approved action is the agent spending money OUT — Foreplay credits in §7 P4, per the Stripe skill.)

## 7. Scope — built in dependency order (Friday hard-stop)
Everything below is in scope. Phases are **build order**, not must-have-vs-nice-to-have: each depends on the prior.
Friday is a hard stop, so a late phase is only at risk if an earlier one slips.

**P1 — the spine (the $5 loop):**
1. Foreplay API import — **1,000+ real ads** (gives `link_url` = the website).
2. **Enrich**: website → business email + site-linked X handle → segment (A = active X · B = email-only).
3. Scoring + ≥85 gate (§5), autonomous publish/skip.
4. Roast (bake-off model) → **auto-post to X** (@-tag if A) **+ email the owner** the roast + offer.
5. Sales page (`/?p=id`) → Stripe **$5** checkout → on payment auto-run fix → **email the buyer**.
6. `/audit` view (live feed, scores + reasoning per post, kill-switch, metrics).

**P2 — real creative + order bump:** AI image fulfillment (**OpenRouter Nano Banana** — same key) — the $5/$12 fix
delivers **generated static ads**, not just copy; + the $12 three-variant pack. ✅ `creative.ts` green.
**P3 — the business:** $49/mo subscription (weekly creatives + competitor monitoring).
**P4 — on-theme flourish:** spend-loop (agent buys its own Foreplay/image credits via the Stripe skill, human-approved) ·
**feedback loop** (which roasts → sales → tune scoring/voice) · NemoClaw deploy/safety wrapper · 3-min VSL.

**Always (Friday):** Demo video (1–3 min) + writeup, tag @NousResearch, Discord + Typeform.

## 8. Non-goals
Giant e-comm / non-owner-led targets · outbound channels beyond the X roast + owner email · ad *buying/management* ·
HIPAA/vertical compliance (that's CARA, not AdChad) · anything not on the Friday critical path.

## 9. Stack & key decisions (locked Wed night)
- **Agent:** Hermes Agent harness (autonomous loop + skills + memory) — the "agent running on its own." **Deploy via
  NemoClaw** if its one-command Hermes blueprint stands up in a Thursday-AM spike (easy runtime *and* a free safety story);
  else a thin TS loop hitting the model endpoint directly. **No local GPU — inference is hosted either way.**
- **Models (harness is model-agnostic — swappable per skill):** **Nemotron 3 Super** (NemoClaw default, cheap,
  NVIDIA-friendly) for high-volume scoring; **roaster = Day-1 bake-off** among **Grok · Hermes-4-405B · Nemotron** on real
  bad ads — output decides. Grok is fully on-theme (the harness is Hermes, not the model). See `hermes-briefing.md`.
- **Ad source:** **Foreplay API** (live; 10k free monthly credits; key at `app.foreplay.co/api-overview`).
- **Human app:** **Next.js + TypeScript on Vercel** (sales page, `/audit` view, metrics, VSL host).
- **Payments:** standard Stripe Checkout to *receive* ($5/$12/$49); the Stripe *skill* is agent-*spend* only (P4).
  Dev in **test mode** (real API, not a mock); **one real live $5** for judging.
- **DB:** Postgres (Vercel Postgres / Neon) — prospects, scores, drafts, orders.
- **Creative gen:** **OpenRouter Nano Banana** (`google/gemini-2.5-flash-image`) → the generated static ad for the $5/$12 fix. Same key, no new dependency.

## 10. Testing discipline
**TDD, red→green, zero mocks/stubs/fixtures.** Every test hits the real thing: real Foreplay calls, real model
completions, real Stripe (test mode is the *real* Stripe API). No fabricated ad data — if a test needs ads, it pulls them.

## 11. Success metrics (demo targets)
**1,000+ ads scanned · 100+ qualified · 25+ roasts · 10+ public X posts · 10+ owner emails · ≥1 real $5 paid + fulfilled · visible audit logs.**

## 12. Risks / open items to verify FIRST THING Thursday AM
- **NemoClaw-for-Hermes spike (~30 min):** does the one-command blueprint deploy our agent cleanly? Early-preview, so
  timebox it — if it fights us, fall back to a thin TS loop on the model endpoint directly. **No local GPU either way (hosted inference).**
- **Hermes skill format** — ✅ confirmed markdown `SKILL.md` (from Iain's suite). Open: how the harness loads/runs *our*
  skills; keep skill logic as plain functions so it runs in the harness *or* the thin loop unchanged.
- **Foreplay API** — ✅ verified live Wed night: key authenticates, `GET /api/discovery/ads` returns real ads, 9,870/10k credits.
- **Postgres** — not yet provisioned: spin up Neon/Vercel Postgres + connection string Thursday AM (tests persist to a real DB).
- **Brand/legal (acknowledged, proceeding):** auto-posting public roasts of named real businesses carries
  defamation/harassment exposure (the **official X API** is sanctioned, so ToS/automation-flag/ban risk is low). Owner
  authorized "just send it." The 35% safety score + self-consistency vote + kill-switch are the guardrails. ("No
  autonomous posting" was Caleb's brief guidance, **not** a Nous rule.)
  **Cold owner email** is commercial email → CAN-SPAM: include an unsubscribe link + a valid physical address, accurate
  from/subject. Low volume for the demo; deliverability needs the verified Resend domain (§ architecture §10).

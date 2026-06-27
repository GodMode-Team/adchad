# Battle-Plan Alignment Review

Line-by-line check of the repo against the **Master Battle Plan** (battle-plan-page.vercel.app). `✅` aligned · `⚠️` diverges, decide · `❌` missing, core beat. Source of truth for voice/look/taste is `CHARACTER.md` + `taste/`.

## Prospecting (battle plan §0, §5.6, §6, §10)

| Battle-plan guideline | Repo today | |
|---|---|---|
| **Scan active X brand ads** — "on X = they see + reply (traction); where judges live." Meta scraping is explicitly **❌ CUT**. | `prospect` now runs **~50/50**: traction = recognizable X brands (via `xread`/URL → vision); revenue = Foreplay SMB. | ✅ |
| **Roast 20-30 recognizable X brands publicly** for live traction ("the roast IS distribution"). | Traction mode added — punch UP at big brands, public-only, no email. | ✅ |
| Punch the **ad, never the person**; brand-safety gate. | N≥3 fairness vote; drops clean ads; opt-out via email tool. | ✅ |
| Don't re-hit the same target; judgment not threshold. | Reads `db prospects`, rotates, picks one prime suspect. | ✅ |
| **5-beat roast contract** (Shock→Teardown→Expertise→Feel-good→CTA) + **6-box viral gate** (Shocking/Useful/Funny/Autonomous-flex/Feel-good/Safe → `/taste`). | The `roast` tool prompt does **not** encode the 5 beats or the viral gate. | ⚠️ |

**The split the plan intends:** *recognizable X brands → traction roasts* (punch up, they reply, the Hall-of-Shame feed judges watch) **+** *reachable SMBs → the $5/$49 revenue* (dogfood the first sub). **Now wired as a ~50/50 dual mode in `skills/prospect`** (Step 0 picks the lagging mode). Tooling note: traction mode reads a brand's ad via `xread`/pasted URL → `vision`; if `xread` can't surface ad creatives, the agent roasts from a pasted creative URL.

## The autonomous money loop (battle plan §5, §6, §7)

| Beat | Repo | |
|---|---|---|
| Agent **creates the Stripe charge via API** (agentic commerce) | `tools/stripe.ts` Checkout/PaymentIntent | ✅ |
| **Stripe Billing** subscription for the $49 | present | ✅ |
| Fix **IMAGE on NVIDIA NIM** (SDXL/FLUX) — *"the single NVIDIA vote-winner"* | `MODEL_IMAGE=google/gemini-2.5-flash-image` | ⚠️ image is on **Gemini**, not a NIM |
| Score on **Nemotron** (NVIDIA inference volume) | `MODEL_SCORE=nvidia/nemotron-3-super-120b-a12b` | ✅ |
| Roast brain = Nous **Hermes-4** | `MODEL_ROAST=nousresearch/hermes-4-405b` ✅ (but `roast/SKILL.md` text still says "voice is Grok") | ⚠️ stale doc |
| **$1 donation via Every.org** on each $5 + **post the receipt** | **nothing** — no Every.org, no donation, no receipt anywhere | ❌ **core beat missing** |
| **Live P&L tile** (earned/compute/donated/roasted/fixed/MRR) | present | ✅ (donated column will read 0 until donation ships) |
| **Glow-Up Wall** (✓-fixed before/afters) — the #1 consumer proof ask | present | ✅ |
| Auto-tweet roasts → Hall of Shame | `xpost` + feed | ✅ |

## Offer & guardrails (battle plan §1, §10)

| Guideline | Repo | |
|---|---|---|
| **One price: free → $5 → $49.** $12 3-pack **❌ CUT** for the hackathon. | `$12` 3-pack still in SOUL, charter, fulfill, funnel order-bump | ⚠️ |
| Sell $49 on **spend-protection / SynthCheck / competitor intel / money-saved**, NOT "weekly creative" (the #1 churn driver) | SOUL/charter still lead the $49 with "weekly creatives" | ⚠️ |
| Instant **opt-out** + "we roast ads, not people" | email tool adds opt-out; brand-safety gate | ✅ |
| **Spend cap** ($25–50, donate only on conversion), approval before spend, kill-switch | guardrails in SOUL; `db status` pause gate | ✅ |
| **Never fake receipts** (first sub = honest dogfood) | honesty rule in SOUL | ✅ |

## Verdict — fix order for the win

1. **❌ Ship the Every.org $1 donation + receipt.** It's a whole battle-plan section, an MVP-core item, and one of the three rails in the money-shot. Right now the "gives back" beat doesn't exist. *(Verify Every.org API key Day 1; Stripe-Climate or one manual lump + real receipt is the fallback — never be without a receipt.)*
2. **⚠️ Move the fix image to an NVIDIA NIM** (build.nvidia.com SDXL/FLUX) + surface GPU-seconds / cost-per-Unfuck. The image is the single biggest NVIDIA vote and it's currently on Gemini.
3. **✅ DONE — recognizable-X-brand traction-roast path** added to `skills/prospect` as a ~50/50 dual mode (keeps Foreplay/SMB for revenue). The public roast of brands the judges follow IS the distribution edge.
4. **⚠️ Encode the 5-beat contract + 6-box viral gate** in the roast tool (gate every public post; run `taste/ADCHAD-TASTE-PACK.md`).
5. **⚠️ Drop the $12 pack** to one price and re-lead the $49 with spend-protection, not weekly-creative.
6. **⚠️ Fix the stale "Grok" line** in `roast/SKILL.md` (config already uses Hermes-4 — good).

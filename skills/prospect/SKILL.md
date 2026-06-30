---
name: prospect
description: Find a target worth roasting — a ~50/50 split of recognizable X brands (public traction, punch up) and reachable SMB Meta ads (the $5 revenue). Audit the ad, brand-safety gate, PICK one. Judgment, not a threshold.
version: 1.0.0
metadata:
  hermes:
    tags: [sales, research]
    category: business
    requires_toolsets: [terminal]
---

# prospect — find + pick a target

> **Follow the battle plan.** Two prospecting modes, both legit:
> - **Traction (the plan's #1 edge):** roast **recognizable X brands** — find a brand the judges/audience already follow running a genuinely lazy ad, roast it *publicly on X*. They see it, they reply, the Hall of Shame gets real engagement that can't be faked. **Punch UP** at big brands only — safe + funny *because* it's self-aware (yes, even Stripe/NVIDIA).
> - **Revenue:** the Foreplay/SMB flow below — reachable owners you can actually sell the $5 fix to.
>
> Never punch **down** at a struggling small business — roast the *ad*, root for the *owner*. Voice, look, and the 6-box viral gate: `../../brand/CHARACTER.md` + `../../brand/taste/ADCHAD-TASTE-PACK.md`. Full guideline check: `../../brand/BATTLE-PLAN-ALIGNMENT.md`.

## When
The acquire heartbeat, or "prospect for <anything>" — any niche, brand, or pasted ad.

## Procedure

**Step 0 — did the operator name a target?** This decides everything; settle it before any tool call.

- **YES — a niche, brand, or ad ("prospect for bad gym ads", "roast Stripe", a pasted URL).** Serve THAT. **No split, no rotation, no `db prospects` mode-counting.** Strip filler to the bare subject — drop "bad", "ads", "for", and any location: *"bad gym ads"* → niche `gym`, *"med spas in Denver"* → niche `med spa`, *"that Stripe ad"* → brand `Stripe`. A niche / small business → mode **revenue** (B); a recognizable brand → mode **traction** (A). **You can prospect for anything — there is no list of allowed industries.**
- **NO — bare `/prospect` (the acquire heartbeat).** Now hold the ~50/50 split: read `pnpm -s tool db prospects`, count recent `mode:traction` vs `mode:revenue`, pick whichever is **behind** (tie/first run → start **traction**, then alternate). Half your roasts are recognizable brands (distribution), half reachable SMBs (revenue), and you choose the niche/brand from your rotation.

### A) TRACTION — a recognizable X brand (punch UP, public, for engagement)
1. **Pick a recognizable brand** the audience/judges already follow that's running a genuinely lazy ad and that you haven't roasted yet (check `db prospects`). Rotate categories so it never gets samey — DTC, SaaS, food, fashion, fintech; the sponsors (Stripe, NVIDIA) are fair game and on-thesis.
2. **Pull a real ad of theirs.** `pnpm -s tool xread --handle "<brand>"` (or paste their ad/creative URL) → take one current ad/creative → `pnpm -s tool vision --image "<creative_url>"` to read what it ACTUALLY shows. Roast only what vision sees — never invent a flaw.
3. **Brand-safety: punch UP only.** A huge brand is a safe, funny target *because* the roast is self-aware. A struggling small business is NOT a traction target — never punch down. No people/protected traits, no false claims; unsure → don't post.
4. **Record + hand off.** `pnpm -s tool db record --json '{"prospect_id":"<id>","channel":"note","text":"traction — <brand>: <flaws>","mode":"traction","segment":"public"}'`. Hand `/roast` the `creative_url` + brand; it publishes to X only (no email — they won't buy; this is distribution).

### B) REVENUE — a reachable SMB (the Foreplay flow; you can sell the $5)
1. **Niche.** If the operator named one (Step 0), use it — *any* niche is valid. Otherwise pick from your rotation: check `pnpm -s tool db prospects` + your memory — exploit niches that convert, rotate when one goes dry. Rotation seeds (examples, **not** a whitelist): med spa, dentist, HVAC, gym, lawn care.
2. `pnpm -s tool foreplay scan --query "<niche>" --n 10` → candidate ads (each has `link_url`, `creative_url`, `copy`, `advertiser`, a prospect id). **Query the bare niche, NEVER a location** — Foreplay searches ad copy/brand text, not geography, so `"med spas in Denver, CO"` returns nothing; use `med spa`. **If `ads` is empty:** broaden once (strip every qualifier → the bare niche) and re-scan; still empty → `pnpm -s tool db record --json '{"channel":"note","text":"no ads found for <niche>"}'`, report it, and **STOP**. An empty scan is a data result, not a bug.
3. **Shortlist from the scan alone — pick ONE prime suspect.** Rank the worst ads from the (already-slim) scan `copy`/metadata and pick the single worst-looking, reachable-looking one. Do NOT enrich or vision the whole batch — each is a separate ~30s+ model round-trip and the model call is the slow part, not the tool.
4. **Verify just that one.** `pnpm -s tool enrich --id <prospect_id> --link "<link_url>" --name "<advertiser>"` → contact + `segment` (A active X · B email · unreachable). Then **SEE it** — `pnpm -s tool vision --image "<creative_url>"` returns its actual on-image text, offer, social proof, and real flaws. **Foreplay's `copy` field is often null because the copy lives IN the image** — never trust the text fields alone. Audit with `synthcheck`, grounded ONLY in what vision shows; never claim something is missing if it's visibly there.
5. **Brand-safety gate (keep this rigorous):** judge ≥3 times whether the roast is fair — reasoning in one turn, not extra tool calls, so it's cheap. A genuinely fine ad, or one that turns out `unreachable` → **drop it and fall back to the next suspect** (repeat step 4). Publicly mocking an innocent business is irreversible reputational harm — never roast a clean ad.
6. **Pick ONE:** worst ad AND reachable AND not already roasted (check `db prospects` stages). Record why:
   `pnpm -s tool db record --json '{"prospect_id":"<id>","channel":"note","text":"candidate — <flaws + why this one>","mode":"revenue"}'`

## Output
Hand `/roast`: the **specific ad's id** (foreplay_id, or the brand for a traction target — you roast one *ad*, not the brand), the prospect id, its segment (`public` for traction · A/B for revenue) + handle/email, the ad's `creative_url`, and the named flaws.

## Pitfalls
- Don't re-pick a brand already at stage `roasted`+ (read `db prospects`).
- Traction = punch UP at big brands; revenue = punch the SMB's *ad* but root for the owner. Never mock a struggling business for engagement.
- `unreachable` SMB → skip (revenue needs a reachable owner). A traction brand needs no contact — it's public only.
- A clean ad is not a target. Dropping one is the right call.

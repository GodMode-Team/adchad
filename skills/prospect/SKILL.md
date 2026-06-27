---
name: prospect
description: Find a business worth roasting — scan live Meta ads, audit the worst, enrich the owner's contact, and PICK the best target. Judgment, not a threshold.
version: 1.0.0
metadata:
  hermes:
    tags: [sales, research]
    category: business
    requires_toolsets: [terminal]
---

# prospect — find + pick a target

## When
The acquire heartbeat, or "find someone to roast in <niche>."

## Procedure
1. **Pick a niche.** Check `pnpm -s tool db prospects` + your memory — exploit niches that convert, rotate when one goes dry. Sane rotation: med spa, dentist, HVAC, gym, lawn care.
2. `pnpm -s tool foreplay scan --query "<niche>" --n 10` → candidate ads (each has `link_url`, `creative_url`, `copy`, `advertiser`, a prospect id). **Query the bare niche, NEVER a location** — Foreplay searches ad copy/brand text, not geography, so `"med spas in Denver, CO"` returns nothing; use `med spa`. **If `ads` is empty:** broaden once (strip every qualifier → the bare niche) and re-scan; still empty → `pnpm -s tool db record --json '{"channel":"note","text":"no ads found for <niche>"}'`, report it, and **STOP**. An empty scan is a data result, not a bug.
3. **Shortlist from the scan alone — pick ONE prime suspect.** Rank the worst ads from the (already-slim) scan `copy`/metadata and pick the single worst-looking, reachable-looking one. Do NOT enrich or vision the whole batch — each is a separate ~30s+ model round-trip and the model call is the slow part, not the tool.
4. **Verify just that one.** `pnpm -s tool enrich --id <prospect_id> --link "<link_url>" --name "<advertiser>"` → contact + `segment` (A active X · B email · unreachable). Then **SEE it** — `pnpm -s tool vision --image "<creative_url>"` returns its actual on-image text, offer, social proof, and real flaws. **Foreplay's `copy` field is often null because the copy lives IN the image** — never trust the text fields alone. Audit with `synthcheck`, grounded ONLY in what vision shows; never claim something is missing if it's visibly there.
5. **Brand-safety gate (keep this rigorous):** judge ≥3 times whether the roast is fair — this is reasoning in one turn, not extra tool calls, so it's cheap. A genuinely fine ad, or one that turns out `unreachable` → **drop it and fall back to the next suspect** (repeat step 4 on it). Publicly mocking an innocent business is irreversible reputational harm — never roast a clean ad.
6. **Pick ONE:** worst ad AND reachable AND not already roasted (check `db prospects` stages). Record why:
   `pnpm -s tool db record --json '{"prospect_id":"<id>","channel":"note","text":"candidate — <flaws + why this one>"}'`

## Output
Hand `/roast`: the **specific ad's id** (foreplay_id — you roast one *ad*, not the brand), the prospect id, its segment + handle/email, the ad's `creative_url`, and the named flaws.

## Pitfalls
- Don't re-pick a brand already at stage `roasted`+ (read `db prospects`).
- `unreachable` → skip; you can't sell to who you can't reach.
- A clean ad is not a target. Dropping one is the right call.

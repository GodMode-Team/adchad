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
2. `pnpm -s tool foreplay scan --query "<niche>" --n 10` → candidate ads (each has `link_url`, `creative_url`, `copy`, `advertiser`, a prospect id).
3. For the 2–3 worst, `pnpm -s tool enrich --id <prospect_id> --link "<link_url>" --name "<advertiser>"` → contact + `segment` (A active X · B email · unreachable).
4. **Audit** the ad with the `synthcheck` skill — name the REAL flaws (weak hook, dead CTA, stock slop, no offer) and how a buyer reacts.
5. **Brand-safety vote:** judge ≥3 times whether the roast is fair. A genuinely fine ad → drop it, never roast.
6. **Pick ONE:** worst ad AND reachable AND not already roasted (check `db prospects` stages). Record why:
   `pnpm -s tool db record --json '{"prospect_id":"<id>","channel":"note","text":"candidate — <flaws + why this one>"}'`

## Output
Hand `/roast`: the **specific ad's id** (foreplay_id — you roast one *ad*, not the brand), the prospect id, its segment + handle/email, the ad's `creative_url`, and the named flaws.

## Pitfalls
- Don't re-pick a brand already at stage `roasted`+ (read `db prospects`).
- `unreachable` → skip; you can't sell to who you can't reach.
- A clean ad is not a target. Dropping one is the right call.

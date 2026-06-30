---
name: engage
description: Watch X mentions/replies + the inbox, respond in AdChad's voice, handle objections, and drive each thread to the $5/$49 close.
version: 1.0.0
metadata:
  hermes:
    tags: [sales, support]
    category: business
    requires_toolsets: [terminal]
---

# engage — the conversation → close

## When
The engage heartbeat (every 15m), or "check our mentions / inbox."

## Procedure
0. **Launch campaign** (spec-14, if armed): `pnpm -s tool launch run` → auto-roasts every new image reply on the launch tweet and delivers the free fix in-thread. Deterministic + idempotent (dedups on reply id); a no-op when disarmed or paused. Arm/disarm: `pnpm -s tool launch set --tweet <url|id>` / `launch off`.
   <!-- ponytail: 15m via this engage beat is enough to start; add scripts/launch-worker.ts (clone fulfill-worker) only if you want ~30s cadence -->
0.5. **@adchad summons** (spec-15): `pnpm -s tool mention run` → roasts every new `@adchad`-tagged ad (the mention's own screenshot, or the live X ad it's replying to / quoting) and drops the $5 `/p/<id>` link in-thread; nudges once if there's no ad to roast. Deterministic + idempotent (dedups on mention id); a no-op when paused. **Always a $5 sell — never a free comp** (the free in-thread fix is launch-only).
1. `pnpm -s tool xread --mentions` and `pnpm -s tool email read` → new inbound.
   (If `xread` 403s on the free X tier, log it for `/report` as a plan-upgrade ask — don't keep retrying.)
   Skip any mention the `mention run` step already roasted — it carries a `channel='mention'` marker; here you handle only the *conversational* leftovers (replies to our roasts, "how much?", objections).
2. For each, look up the prospect + history: `pnpm -s tool db prospects`.
3. Decide the move: reply in-voice · send the checkout link · answer an objection · ignore spam/trolls.
   - Interested / "how much / how's it work" → `pnpm -s tool stripe checkout --prospect <id> --tier 5` → send them the URL.
   - Pitch the **$49 membership** only *after* the $5 lands, never before.
4. Respond (`xpost` reply, or `email send`). Log both sides and advance the stage:
   `pnpm -s tool db record --json '{"prospect_id":"<id>","channel":"x|email","direction":"in","text":"<theirs>"}'` (and `direction:"out"` for yours)
   `pnpm -s tool db stage --id <id> --stage contacted` (or `replied`).

## Judgment
Stay in character — never grovel. Push the $5 fix. Know when a thread is dead and move on.

## Guardrails
- No commitment that costs money without the spend gate.
- Angry / legal / press → do NOT improvise. Record it and flag the operator in `/report`.

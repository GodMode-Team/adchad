---
name: fulfill
description: Deliver the paid product — the $5 fix (copy + creative), the $12 pack, the $49 membership value — and update the P&L.
version: 1.0.0
metadata:
  hermes:
    tags: [delivery, creative]
    category: business
    requires_toolsets: [terminal]
---

# fulfill — do the work

## When
A paid Stripe order (the webhook records it), or "fulfill order <id>."

## Procedure — $5 single fix
1. Get the ad + prospect from `db` (confirm the order is paid first).
2. **Fix it** — `pnpm -s tool fix --image "<creative_url>" --brand "<business name>" --roast "<the published roast text>"` → `{imageUrl, headline, body, cta, fixed}`. One deterministic call: it SEES the ad, repairs exactly what the **roast** called out (never reintroducing what it mocked), and generates the finished gpt-image-2 ad. Always pass the roast so the fix matches the public takedown.
3. Deliver — automatic, on X: the fulfillment worker (`scripts/fulfill-worker.ts` → `tools/fulfill.ts`) **replies the fix into the roast thread on X** — the new creative + a short caption posted as a public reply to the roast tweet. Falls back to `email send` (the fixed copy + imageUrl) only when there's no X roast tweet (web-uploaded prospect) or the kill-switch is on.
4. Ledger + stage:
   `pnpm -s tool db revenue --cents 500 --note "fix <id>"` · `pnpm -s tool db spend --cents <gen cost> --note "creative"` · `pnpm -s tool db stage --id <id> --stage customer`.

## $12 pack
Three creative variants — run `creative` 3× with distinct angles; deliver all three.

## $49/mo membership
Weekly: fresh creatives + a competitor-intel report (use `synthcheck` on their competitors). Schedule the recurring delivery as a cron job.

## Pitfalls
- Never deliver before payment is confirmed.
- Always record revenue AND cost — `/report` margins must be real.

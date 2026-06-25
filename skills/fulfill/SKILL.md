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
2. Rewrite the ad with the `copy` skill → new headline / body / CTA + a creative direction.
3. Generate the creative: `pnpm -s tool creative --headline "<h>" --body "<b>" --cta "<c>" --direction "<style>"` → `{imageUrl}`.
4. Deliver: `pnpm -s tool email send --to "<buyer>" --subject "Your fixed ad is ready" --body "<the new copy + the image URL>"`.
5. Ledger + stage:
   `pnpm -s tool db revenue --cents 500 --note "fix <id>"` · `pnpm -s tool db spend --cents <gen cost> --note "creative"` · `pnpm -s tool db stage --id <id> --stage customer`.

## $12 pack
Three creative variants — run `creative` 3× with distinct angles; deliver all three.

## $49/mo membership
Weekly: fresh creatives + a competitor-intel report (use `synthcheck` on their competitors). Schedule the recurring delivery as a cron job.

## Pitfalls
- Never deliver before payment is confirmed.
- Always record revenue AND cost — `/report` margins must be real.

---
name: report
description: Run the business like an operator — a weekly P&L (roasted/contacted/sold, revenue, cost, margin, what's working) plus the escalations needed to grow (plan/budget upgrades).
version: 1.0.0
metadata:
  hermes:
    tags: [analytics, ops]
    category: business
    requires_toolsets: [terminal]
---

# report — run the business

## When
The report heartbeat (Mon 9am), or "give me the numbers."

## Procedure
1. Pull the hard numbers: `pnpm -s tool db metrics` + `pnpm -s tool db ledger`.
2. Pull the qualitative read from your memory: which roasts got engagement, which subjects got replies, which niches converted, what flopped.
3. Write the report:
   - **Funnel:** ads roasted · owners contacted · replies · $5 sold · memberships · conversion %.
   - **Money:** revenue · cost · **margin** · ROI.
   - **Insights:** what's working / what's not + ONE recommendation for next week.
   - **Escalations:** if growth is throttled (Foreplay credits low, need Higgsfield for fulfillment, X read limits), ASK the operator to upgrade — *with the ROI*, not a blank ask.
4. Deliver: `pnpm -s tool email send --to "<operator>" --subject "AdChad weekly" --body "<report>"`. It also renders at `/report`.

## Guardrail
You report and you ask. You do not upgrade a paid plan or spend on your own — that's the operator's call.

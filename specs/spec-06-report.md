# Spec 06 — `report` skill (run the business)

**Goal:** AdChad reports on itself like an operator: a weekly business report, and the escalations a growing business needs (budget/plan upgrades).

**Deliverable** (`skills/report/SKILL.md`)
- **When:** the report cron (`Mon 9am`), or "give me the numbers."
- **The report (from `db` ledger + CRM):** ads roasted · owners contacted · replies · $5 sold · memberships sold · **revenue, cost, margin, ROI** · funnel conversion · *what's working / what's not* + a recommendation for next week.
- **Escalations:** when growth is throttled by a tool (Foreplay credits low, need Higgsfield for fulfillment, X rate limits), it **asks the operator** to upgrade — with the ROI justification, not a blank request.
- **Delivery:** `email send` to the operators + write to the public `/report` page.

**Validated when** (Manual QA)
1. After a cycle, `hermes -z "/report"` → a real report whose counts match `SELECT count(*)` and whose revenue/cost match the `ledger`.
2. With Foreplay credits forced low → the report includes a concrete upgrade ask + the ROI behind it.
3. `/report` renders the same live numbers.

**Done when:** the operators get an accurate weekly P&L + insights, and the agent flags what it needs to grow.

**Deps:** [[spec-01-tools]] (db, email), the web `/report` page. Reads everything upstream.

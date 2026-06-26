# Spec 09 — Live feed (`/live` — watch AdChad work)

**Goal:** a public, no-auth page where anyone watches the agent run the business in near-real-time — a streaming timeline of what it just did (prospected → roasted → sold → fulfilled) plus a live P&L. The public-spectacle surface; pairs with @adchadofficial and the Slack work-log. Read-only: it shows what the agent *already* records, never drives it.

**Data:** reuse what the agent already writes — `interactions` (roasts/replies/emails/fixes), `ledger` (revenue/cost), `prospects` (new targets). **No new tables, no new writes.**

**Deliverable**
- **`tools/db.ts` → `feed` op** (named op, no raw SQL): UNION the recent rows of `interactions` + `ledger` + new `prospects`, normalized to `{ts, kind, icon, title, detail, link?, image?}`, newest-first, `limit 50`, joined to `prospects` for display names. Plus a `stats` block (reuse `metrics`+`ledger`): prospects, roasts, sales, revenue/cost/margin.
  - 🔍 new target — `prospects.created_at` → "New target: {name}"
  - 🔥 roast — `interactions.channel='x' & direction='out'` → "Roasted {name}" · `link=https://x.com/i/status/{ref}` · detail = text snippet
  - 💬 reply — `channel in (x,email) & direction='in'` → "{name} replied"
  - 📧 email — `channel='email' & direction='out'` → "Emailed {name}"
  - ✅ fix — `channel='fix'` → "Delivered fix to {name}" · `image=ref`
  - 💸 money — `ledger` → "+$5.00 — {note}" / "−$0.04 — {note}"
- **`app/api/feed/route.ts`:** `GET` → `db feed` → JSON `{events, stats}`. `export const dynamic = 'force-dynamic'` (never cached).
- **`app/live/page.tsx`:** mobile-first dark page. Header = AdChad mark + a `● LIVE` dot + P&L/counters. Body = vertical timeline (icon · title · detail · "2m ago", optional fix thumbnail, tweet link). A tiny client poller refetches `/api/feed` every 5s and prepends new events. Empty state: "AdChad is warming up…". (ponytail: client poll over SSE/websocket — 5s is plenty; meta-refresh is the zero-JS fallback if the poller is overkill.)

**Privacy (it's PUBLIC):** expose only the prospect **display name**, roast text (already public on X), public tweet links, fix images, and ledger amounts/notes. **Never** emails, `from_addr`, subjects, or buyer PII. The `feed` op must not select those columns.

**Failing test** (`tests/live.test.ts` + a route test, live DB)
1. `db feed` on a DB with ≥1 roast interaction + ≥1 ledger row → normalized events (each has `ts,kind,title`) newest-first + a `stats` block with `margin_cents`; and **no event carries an email/PII field**.
2. `GET /api/feed` → 200 JSON with `events[]` + `stats`, non-cached headers.
3. `/live` renders ≥1 event row + the P&L counters (RED before the op/route/page exist).

**Done when:** open `/live` on a phone, trigger one roast on the box, and within ~5s it appears in the timeline with correct P&L — no auth, no manual refresh.

**Deps:** [[spec-01-tools]] (db), [[spec-08-funnel]] (same Next app, dark theme). Reads only what [[spec-03-roast]] / [[spec-05-fulfill]] already record.

# Spec 08 — Funnel (sales page → checkout → delivery)

**Goal:** the only web AdChad needs — a per-prospect sales page that converts the roast into a $5 payment, then delivers the fixed ad. **Never link tweets/emails straight to Stripe** (sessions expire; you lose the re-sell).

**Routes** (Next.js)
- `/` — homepage: what AdChad is (brand + the ladder).
- **`/p/<id>`** — sales page: renders the prospect's stored ad `creative_url` + the roast text + a before→after promise + ONE CTA **"UNFUCK IT — $5"**. Mobile-first. CTA → `/api/checkout?p=<id>&tier=5`.
- `/api/checkout` → `stripe checkout` tool → **303 to a FRESH** Stripe-hosted session.
- `/api/stripe/webhook` → on `checkout.session.completed`: `orders` row `paid` + `ledger` revenue + a `fulfill` task queued (`interactions`).
- `/?paid=1` → "your fix is generating — check your inbox in ~2 min." (X-originated roasts get the fix as a **public X reply** in the roast thread instead).
- `/report` → live funnel + P&L (reads `db`). Delivery = the fix **replied publicly into the roast thread on X** (email fallback when there's no X roast tweet / kill-switch on); optional `/fix/<order>` view.

**Failing test** (`tests/funnel.test.ts` + a route test, live)
1. `/p/<id>` for a roasted prospect renders the ad image + roast + a `$5` CTA whose href hits `/api/checkout`.
2. `GET /api/checkout?p=<id>&tier=5` → 303 to a real **test-mode** Stripe URL.
3. A real `checkout.session.completed` (Stripe CLI) → `orders` `paid` + a `ledger` revenue row + a fulfill `interactions` row.

**Done when:** a roast link → `/p` → Stripe → pay → the fix lands as a public reply in the roast thread on X (email fallback if no X tweet / paused), no human step.

**Deps:** [[spec-01-tools]] (stripe, db, creative, email), [[spec-05-fulfill]]. Mobile-first. Blocks: the live $5 demo.

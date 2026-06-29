# Build plan — Spec 13: the $49/mo retainer ("Hire Chad")

One-click off-session upsell on the thank-you page. Take the money with zero friction, gather intake,
promise the first report 1 week after the form is submitted. Weekly report engine is OUT of scope.

Decisions (from the user, 2026-06-29):
- I create the recurring $49/mo Price via Stripe API — test-mode for local QA, live-mode for prod (`STRIPE_PRICE_RETAINER`).
- QA: full e2e in Stripe **test mode** locally, then a live prod test together once green.
- Ship: deploy live when green.

## Chunks

### 0. Stripe Price + env (setup)
- Create a recurring $49/mo Price (product "AdChad — Chad on retainer") in **test** (sk_test) and **live** (sk_live).
- `STRIPE_PRICE_RETAINER` → `.env.local` (test price), `.env.prod` + Vercel prod env (live price).
- Ensure the **live webhook endpoint** subscribes to `invoice.paid` (currently only `checkout.session.completed`).

### 1. Schema (db/schema.sql)
- `prospects.stripe_customer text` — saved Stripe customer (set on first $5/$12 checkout).
- `prospects.stripe_sub text` — active retainer subscription id (idempotency + "hired" detection).
- `prospects.stripe_livemode boolean` — mode the saved customer/sub belong to (test vs live coexist in one DB).
- `orders.livemode boolean default true` / `ledger.livemode boolean default true` — keep test-mode money off public surfaces.
- `onboarding(id, prospect_id → prospects, answers jsonb, submitted_at)`.

### Mode safety (shared DB, two Stripe modes — local=test, prod=live)
- Stripe ids are mode-scoped → `hireChad` only honors `stripe_customer`/`stripe_sub` when `stripe_livemode` matches the
  running key (`STRIPE_SECRET_KEY.startsWith('sk_live')`); cross-mode = treat as unsaved → hosted Checkout fallback.
- Webhook stamps `orders.livemode`/`ledger.livemode` from `event.livemode`; records the public "hired" interaction
  only when `event.livemode`. `metrics`/`ledger`/`feed` count only `coalesce(livemode,true)`.
- QA uses throwaway test prospects, deleted after.

### 2. Card-saving on the $5/$12 checkout (prereq for one-click) — tools/stripe.ts
- `mode:'payment'`: add `customer_creation:'always'` + `payment_intent_data:{ setup_future_usage:'off_session' }`.
- Accept optional `customer` to reuse on the tier-49 hosted fallback; tier-49 uses `STRIPE_PRICE_RETAINER`.
- Set `subscription_data.metadata.prospect` / `metadata.prospect` so `invoice.paid` can resolve the prospect.

### 3. Retainer core (tools/retainer.ts) — injected deps, TDD'able (mirrors fulfill.ts)
- `hireChad(prospectId, deps)` → `{status:'subscribed'|'already'|'fallback', url?}`:
  - existing `stripe_sub` → `already`; no `stripe_customer` → `fallback` (hosted $49 Checkout);
  - `deps.createSub` active → persist `stripe_sub`, `subscribed`; requires_action / card error → `fallback`.
- `bookRetainerInvoice({invoiceId, prospectId, email, amountCents, firstInvoice}, deps)`:
  - idempotent on `invoiceId` (orders.stripe_id); insert order tier 49 + ledger revenue + `retainer` interaction;
  - `firstInvoice` → `deps.send` the confirmation email (form link + 1-week promise), stage='member'.

### 4. Webhook (app/api/stripe/webhook/route.ts)
- `checkout.session.completed`: persist `s.customer` → `prospects.stripe_customer`; record order ONLY for `mode==='payment'` (subscription orders come from `invoice.paid`).
- `invoice.paid`: retrieve subscription → `metadata.prospect`, `billing_reason==='subscription_create'` → `bookRetainerInvoice`.

### 5. Upsell + onboard routes
- `POST /api/upsell?p=<id>` → `hireChad` → JSON.
- `POST /api/onboard` → insert `onboarding` → `{ok, reportBy:+7d}`.
- `app/onboard/[id]/page.tsx` + client form (curated questions: business · who it's for · the offer · USP · top-3 competitors · where they run ads · budget & target · 30-day win · brand assets + never-say · report email).

### 6. Thank-you page (app/p/[id]/Funnel.tsx done step)
- `hired` state (+ read `?hired=1` for hosted-fallback return). Hired → video gone, Yes/No replaced by
  "Great choice. Fill out this form and I'll get started. You can expect your first report a week from filling out the form." + [FILL OUT THE FORM →] (`/onboard/<id>`).
- "Hire Chad now for $49/mo" → POST /api/upsell → subscribed/already → `setHired`; fallback → redirect to url.

### 7. Feed (tools/db.ts interactionEvent)
- `channel='retainer'` → `{kind:'hired', icon:'💼', title:'<who> hired Chad — $49/mo'}`.

## Tests (RED first)
- `tests/tools/retainer.test.ts`: hireChad (already / fallback-no-customer / subscribed+persist / fallback-on-requires_action); bookRetainerInvoice (idempotent once; firstInvoice→send; renewal→no send).
- `tests/tools/feed-event.test.ts`: retainer interaction → hired event.
- onboarding insert (route or db) → row persisted.

## Manual QA (test mode, e2e via Stripe CLI)
`stripe listen --forward-to localhost:3000/api/stripe/webhook` → pay $5 (test card, card saved) → Hire Chad →
off-session sub → invoice.paid books order+revenue+email+feed → "Great choice" + form → submit → onboarding row →
/live shows 💼 + +$49.00. Fallback path: no saved customer → hosted $49 Checkout → pay → books.

## Out of scope
Weekly report workflow; SCA decline UX beyond the Checkout fallback; dynamic per-business questions.

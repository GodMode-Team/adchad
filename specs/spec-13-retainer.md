# Spec 13 — The $49/mo retainer ("Hire Chad"): one-click upsell → intake form → weekly delivery

**Status:** SPEC ONLY — not built. Captures the flow so we can ship it next.

## Why
We sell a $5 one-off fix today. The $49/mo retainer is the real business, but **we haven't
defined the weekly fulfillment workflow yet.** This spec lets us:
1. **Take the money with zero friction** — the buyer already paid $5/$12 seconds ago, so the
   card is on file. Clicking "Hire Chad now for $49/mo" should **auto-charge, no CC re-entry.**
2. **Tell them things are moving** without over-promising a workflow we haven't built — gather the
   info we'll need, and set a concrete expectation: **first report one week from when they fill the form.**

## The product (what $49/mo buys)
Delivered weekly, first drop **1 week after the intake form is submitted**:
- **A fresh new ad** — new creative + copy each week.
- **Competitive intelligence** — what their competitors are running (Foreplay already powers this).
- **A performance review** — how their current ads are doing + what to change.

## The flow
```
Thank-you page (?paid=1)                 [buyer already has a card on file from the $5/$12 order]
   └─ clicks "Hire Chad now for $49/mo"
        → POST /api/upsell?p=<id>         (NO new Checkout, NO CC re-entry)
            → Stripe: create $49/mo subscription on the saved customer, off_session
        → on success, the thank-you page swaps state:
            • video + Yes/No DISAPPEAR
            • copy: "Great choice… Fill out this form and I'll get started.
                     You can expect your first report a week from filling out the form."
            • a button → the intake form (/onboard/<id>)
        → ALSO email them (at their Stripe-captured email — no re-ask): "You hired Chad" + the form link + the 1-week expectation
   └─ buyer fills the intake form (/onboard/<id>)
        → responses stored; the 1-week clock starts at submission
        → confirmation: deliverables + "first report by <date+7d>"
   └─ (future) weekly worker generates the report — OUT OF SCOPE here (workflow TBD)
```

## 1. One-click charge (no CC re-entry)
The hard requirement: clicking Yes must **not** send them back to Stripe Checkout.

**Prerequisite (small change to the $5/$12 checkout, `tools/stripe.ts`):** save the card to a
reusable customer at purchase time so we can charge it again off-session.
- For `mode:'payment'` (the $5/$12 tiers): set `customer_creation:'always'` and
  `payment_intent_data:{ setup_future_usage:'off_session' }`.
- Webhook (`checkout.session.completed`): persist `session.customer` (Stripe Customer id). Set that
  customer's `invoice_settings.default_payment_method` to the PM used, so the subscription can charge it.
- Store on the prospect: new column `prospects.stripe_customer text`.

**The upsell endpoint `POST /api/upsell?p=<id>`:**
1. Look up `stripe_customer` for the prospect. If none (they reached the page without a saved card),
   **fall back** to a normal subscription Checkout redirect (`tools/stripe.ts checkout({tier:49})`).
2. Else create the subscription off-session:
   ```ts
   stripe.subscriptions.create({
     customer,
     items: [{ price: process.env.STRIPE_PRICE_RETAINER }],   // a reusable $49/mo recurring Price (create once)
     default_payment_method,                                  // the saved card
     off_session: true,
     metadata: { prospect },
   })
   ```
3. Record an order (tier 49, status from the subscription) + book revenue on the `invoice.paid` webhook.

**SCA caveat (don't skip):** off-session charges can come back `incomplete` with `requires_action`
(3DS, common on EU cards). On that status, return a `requires_action` flag and have the page fall
back to the hosted subscription Checkout. Most US cards charge silently; this is the safety net.

**Idempotency:** guard `/api/upsell` so a double-click can't create two subscriptions (one active
subscription per prospect — check before create).

## 2. Thank-you page "Yes" state (the UI change)
`app/p/[id]/Funnel.tsx` done step. Add a `hired` state.
- On Yes: `fetch('/api/upsell?p=<id>')`. While pending, disable the button ("charging…").
- On success (`hired = true`): in the green band, **replace the video + the Yes/No buttons** with:
  > **Great choice.** Fill out this form and I'll get started.
  > You can expect your **first report a week from filling out the form.**
  >
  > [ FILL OUT THE FORM → ]   (→ /onboard/<id>)
- The rest of the page (WATCH CHAD WORK + tweet + feed + dead ad) stays.
- On `requires_action` / failure: show the existing $49 Checkout link as the fallback CTA.

## 3. The confirmation email
Sent from the upsell handler (reuse `tools/email.ts send`). Chad voice. It confirms the hire, links
the form, and lays out the same expectations shown on the page.
- **Who we send to — grab it from Stripe, don't ask again.** The buyer's email is already captured by
  the $5/$12 Stripe Checkout (`session.customer_details.email`) and **already stored on `orders.buyer_email`**
  by our webhook (it also lives on the Stripe Customer / can be read via `stripe.customers.retrieve`).
  The upsell handler reads it from there → **zero re-entry**.
  - *Fallback (worst case):* if it's somehow missing (a future card-on-file path that skipped email
    capture), prompt for the email on the thank-you page before charging — but with Checkout-captured
    email this should never fire.
- **Subject:** "You hired Chad. Let's get to work. 💪"
- **Body:** confirms the $49/mo, the 3 deliverables, the **form link** (`/onboard/<id>`), and the same
  expectation as the page: "your first report lands **one week after you submit the form** — so don't sit on it."

## 4. The intake form (`/onboard/<id>`)
A branded page on adchad.ai (not a third-party form) that POSTs to `/api/onboard` → stores responses
(new table `onboarding(prospect_id, answers jsonb, submitted_at)`), then shows a confirmation with the
deliverables + "first report by <submitted+7d>".

**v1 = a curated, static question set** (below — generated to dial the service in). *Future:* generate
the questions per-business with the agent from what we already know (their ad + roast). Recommend
static for v1 (no LLM call, instant, predictable).

**Questions (the curated set):**
1. **Business** — What do you sell, in one sentence?
2. **Who it's for** — Describe your ideal customer (who they are, what keeps them up at night).
3. **The offer** — Your single best promotion / hook right now?
4. **Why you** — What makes you different from the other guys? (your unfair advantage)
5. **Competitors** — Your top 3 competitors (names or links) — so I can watch what they run.
6. **Where you run ads** — Meta / Google / TikTok / none yet + links to anything live.
7. **Budget & target** — Monthly ad budget and your target cost-per-lead/sale (rough is fine).
8. **What a win looks like** — In 30 days, what result makes this a no-brainer to keep?
9. **Brand** — Logo + colors + tone, and anything I should NEVER say.
10. **Where to send it** — Best email for your weekly report.

After submit: "🔒 Locked in. First report by **<date>**. New ad + competitor intel + a teardown of
your current ads — every week."

## Data model
- `prospects.stripe_customer text` — saved Stripe Customer (for off-session charges).
- `orders` — already has tier 49; mark these as `source:'upsell'` (or a note) to distinguish from a
  cold $49 Checkout.
- `onboarding(prospect_id text, answers jsonb, submitted_at timestamptz)` — form responses.
- env: `STRIPE_PRICE_RETAINER` (the $49/mo recurring Price id).

## Out of scope / open questions
- **The weekly fulfillment workflow itself is deliberately NOT specified here** — that's the whole
  point: take the money + gather info now, define + build the recurring report later.
- SCA/3DS UX for off-session declines (we fall back to Checkout; fine for v1).
- Whether the form should be dynamic per-business (deferred; static set ships first).
- Dunning / failed-renewal handling on the subscription (Stripe Smart Retries default for v1).

## Acceptance criteria
- [ ] A buyer who just paid $5/$12 can click "Hire Chad now for $49/mo" and get charged **without
      re-entering a card** (US card, no SCA) — a $49/mo subscription appears in Stripe.
- [ ] On success the thank-you page hides the video + Yes/No and shows the "Great choice…" copy + form CTA.
- [ ] They receive a confirmation email — to the email **Stripe already captured** (no re-ask) — with
      the form link + the 1-week expectation.
- [ ] `/onboard/<id>` collects the 10 answers, stores them, and confirms "first report by <+7 days>".
- [ ] No saved card / SCA required → graceful fallback to the hosted $49 Checkout (no dead end).
- [ ] Double-click / refresh can't create two subscriptions.

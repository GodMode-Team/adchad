# Spec 13 — The $49/mo retainer ("Hire Chad")

**Status:** SPEC ONLY — not built.

**Why:** the weekly fulfillment workflow isn't defined yet, so for now we **take the money with zero
friction, then gather info and set one clear expectation: first report 1 week after the form is filled.**

**Product ($49/mo):** a fresh ad weekly + competitive intelligence + a review of how their current ads perform.

## The flow (thank-you page → form)
1. **One-click charge, no CC re-entry.** They paid $5/$12 seconds ago, so the card's on file. Yes →
   `POST /api/upsell?p=<id>` creates the $49/mo subscription on the saved Stripe customer, `off_session`.
   - Prereq: the $5/$12 Checkout must save the card — `setup_future_usage:'off_session'` + persist
     `session.customer` to `prospects.stripe_customer`. Needs a reusable $49/mo Price (`STRIPE_PRICE_RETAINER`).
   - Idempotent (one active sub per prospect). SCA/`requires_action` or no saved card → fall back to the
     hosted $49 Checkout (`tools/stripe.ts checkout({tier:49})`) — never a dead end.
   - **Book it:** the off-session sub fires `invoice.paid`, **not** our `checkout.session.completed` webhook
     — record the tier-49 order + revenue on that event so the P&L / Live feed stay correct.
2. **Thank-you page swaps state** (`Funnel.tsx` done step, `hired` flag): the **video + Yes/No disappear**,
   replaced by — *"Great choice. Fill out this form and I'll get started. You can expect your first report
   a week from filling out the form."* + a **[FILL OUT THE FORM →]** button (`/onboard/<id>`).
3. **Confirmation email** (`tools/email.ts`) to the email **Stripe already captured** (`orders.buyer_email`
   — no re-ask; re-prompt only if somehow missing): confirms the hire, the form link, same 1-week expectation.
4. **Intake form** `/onboard/<id>` (branded; POST → `onboarding(prospect_id, answers jsonb, submitted_at)`).
   The **1-week clock starts at submission**; confirm "first report by <+7 days>". v1 = static curated questions:
   business · who it's for · the offer · why-you/USP · top-3 competitors · where they run ads · budget & target ·
   what a 30-day win looks like · brand assets + never-say · report email.

## Out of scope
The **weekly report workflow itself** (deliberately deferred — money + intake now, build the recurring engine later);
SCA decline UX (Checkout fallback covers it); dynamic per-business questions (static set ships first).

**Done when:** a $5/$12 buyer clicks Yes → charged $49/mo with **no card re-entry** (US card) → page shows the
"Great choice…" copy + form link → confirmation email lands at their Stripe email → `/onboard/<id>` stores the
answers and promises a report in 7 days. Falls back to Checkout if no saved card / SCA.

**Deps:** [[spec-01-tools]] (`stripe`, `email`), [[spec-08-funnel]] (thank-you page), [[spec-05-fulfill]].

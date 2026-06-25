# Spec 05 — $5 checkout + auto-fulfill

**Goal:** From the sales page (`/?p=<id>`), take a $5 Stripe payment; on the paid webhook, generate the fix (Iain's `copy` **+ a generated static ad image**) and email it to the buyer.

**Contract**
- `POST /api/checkout` → Stripe Checkout session ($5, references prospect + roast). Returns checkout URL.
- `POST /api/stripe/webhook` on `checkout.session.completed` → `fulfill(order)` then `fulfillmentEmail(buyer, fix)`.
- `lib/fulfill.ts` → `fulfill(order): Promise<Fix>` — `copy` skill → text, then `lib/creative.ts` generates a **static ad image** from it → `{ headline, body, cta, creativeDirection, imageUrl }`.
- `lib/creative.ts` → `generate(fix): Promise<imageUrl>` — Venice image API (or Gemini / Nano Banana).
- `lib/email.ts` → `fulfillmentEmail(to, fix)` via Resend (includes the image).

**Failing test** (`tests/checkout.test.ts`, live)
1. `POST /api/checkout` creates a real **test-mode** Stripe session (real API), $500 cents, prospect ref in metadata.
2. Fire a real `checkout.session.completed` (Stripe CLI trigger) → `fixes` row written with non-empty headline/body/cta **+ a real `image_url`**.
3. `fulfillmentEmail()` returns a real Resend message id. (One **live** $5 charge reserved for the demo.)

**Done when:** paying $5 auto-delivers the fix to the buyer's inbox — no human step.

**Deps:** Stripe keys, `copy` skill, Resend, `orders`/`fixes` rows. Blocks: P2 (Spec 08).

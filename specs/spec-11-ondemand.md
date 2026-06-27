# Spec 11 — On-demand roast + creative score

**Goal:** two backend primitives the redesign needs — (a) a real **0–100 creative score** threaded through the pipeline, and (b) a real **on-demand roast** from a user-uploaded ad screenshot (the Home ROAST-ME box). Both make the free roast genuinely real, not canned.

## Creative score (0–100)
- Wherever we `vision` an ad, also emit a **`score` (0–100)** + a one-line verdict, grounded ONLY in the visible flaws (lower = worse). Add it as a `score` tool (or extend `vision`/`roast` output) — one model call, no new vendor.
- Persist to the **existing `scores` table** (`ad_id`, `prospect_id`, `total`, `votes` jsonb, `gate`). Surface it: `db page`/`gallery`/`feed` include `score` so Funnel (`23→97`), Live (target/roast/fix), and Home (hero verdict) can show it.
- The agent's `/prospect`→`/roast` path scores too — so every roast carries a number.

## On-demand roast — `app/api/roast/route.ts` (POST)
Input: an image (screenshot) + email. Flow (no human):
1. Upload the screenshot → **Vercel Blob** (public URL).
2. `vision` → `score` → `roast` on that exact creative (the "ad handed to you → reply" path — a private roast, **not** an X post).
3. Persist: a `prospects` row (email = contact, `email_source='inbound'`, a slug id) + an `interactions` row (the roast, `channel='roast'`/`direction='out'`) + a `scores` row.
4. **Email** the roast + score + the `/p/<id>` $5 link (CAN-SPAM footer via the `email` tool).
5. Return `{ prospectId, score, roast, originalUrl }` so the Home box reveals it inline and links to `/p/<id>`.
- **Rate-limit** (per-IP + per-email, a few/day) — each call spends a few cents (vision + score + Grok); cap abuse. Kill-switch (`db status` paused) blocks any *publish/email-send*, but returning the roast to the uploader is allowed (it's the product).

**Failing test** (live, no mocks)
1. `score` on a real ad image → an integer **0–100** + a verdict string.
2. `POST /api/roast` (a test image + email) → `{ prospectId, score:0–100, roast:string, originalUrl }`; persists a prospect + interaction + score row (assert the rows exist); a 2nd-over-limit call from the same email → 429.
3. `db page --id <prospectId>` then returns that ad + roast + score (feeds the Funnel).

**Done when:** drop a screenshot in the Home box → a real score + roast back in ~30s + a working `/p/<id>` link + an email — zero human steps.

**Deps:** [[spec-01-tools]] (`vision`, `roast`, `creative`, Blob, `email`), [[spec-09-live]] (`db`). Feeds: [[spec-10-design]] (Home box, Funnel score, Live score).

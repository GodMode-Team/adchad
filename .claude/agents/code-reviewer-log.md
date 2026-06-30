# Code + Security Review — `/live` public activity feed

**Reviewer:** code-reviewer (security-weighted, endpoint is PUBLIC + no-auth)
**Date:** 2026-06-26
**Scope (uncommitted diff):** `tools/db.ts` (`feed` op), `app/api/feed/route.ts`, `app/live/page.tsx`, `app/page.tsx` (link), `skills/prospect/SKILL.md` + `specs/spec-02-prospect.md` (prose), new tests `tests/feed-route.test.ts`, `tests/tools/db-feed.test.ts`, `specs/spec-09-live.md`.

**Verdict:** No BLOCKERs. The core security posture is sound — PII is correctly stripped, all SQL is parameterized via postgres.js tagged templates, and React's default escaping covers the text rendering. One MAJOR (DoS/DB-amplification on an unauthenticated, uncached, multi-query endpoint) and several MINORs below.

---

## Security checklist results

1. **PII / Privacy — PASS.** The `feed` op never selects `from_addr`, `subject`, or `buyer_email` (`orders` is not queried at all). Of the columns it does fetch (`i.text`, `i.ref`), `text` is only emitted for `channel='x' & direction='out'` (a roast — already public on X). Inbound replies/DMs and outbound emails emit a title only ("{name} replied" / "Emailed {name}") with no body. Verified independently of the test. See MINOR-3 for a defense-in-depth caveat.
2. **SQL injection — PASS.** The `feed` op contains zero interpolation; all five queries are static tagged templates. `run('metrics')`/`run('ledger')` are likewise static. `db` is a fixed named-op switch — no model-supplied SQL reaches the driver.
3. **XSS — PASS (React-escaped).** `title`/`detail`/`icon` render as JSX text children; no `dangerouslySetInnerHTML` anywhere. The `<a href>` is scheme-locked to `https://x.com/i/status/${ref}` (a malicious `ref` cannot inject a `javascript:` scheme or escape the x.com host). `<img src>` cannot execute JS even with a `data:`/`javascript:` value. See MINOR-2 for the residual img concern. `rel="noreferrer"` is correctly set on the external link.
4. **SSRF — N/A server-side.** The server performs only DB reads; it never fetches a DB-controlled URL. The `<img src>` fetch happens in the *viewer's* browser (a client-side tracking/mixed-content concern, MINOR-2), not a server SSRF.

---

## Findings

### MAJOR-1 — Public, unauthenticated, uncached endpoint with no rate limit → DB amplification / DoS
`app/api/feed/route.ts:7` + `tools/db.ts:88-97`
Every `GET /api/feed` runs **5 DB queries** (3 selects + `metrics` + `ledger`), is `force-dynamic` + `no-store`, has no auth and no rate limit. The `/live` poller hits it every 5s per viewer, and any anonymous caller can hammer it. Cheap to request, comparatively expensive to serve → cost/availability vector on the most public surface in the app.
**Fix:** add a small server-side in-memory micro-cache in the `feed` op (e.g. memoize the payload for ~2-3s) — this is compatible with the `no-store` browser header (which only governs browser/CDN caching) and collapses N concurrent pollers into one DB hit. Optionally a lightweight IP rate limit on the route. (Judgment call — acceptable to defer for a demo, but it is the one real security/cost weakness on the public surface.)

### MINOR-2 — `<img src>` from a DB value on a public page (viewer tracking / mixed content)
`app/live/page.tsx:77`
`e.image` = `interactions.ref` for `channel='fix'`, rendered as `<img src={e.image}>`. No JS-execution risk (img src can't run script), but an attacker who can write `interactions.ref` (agent prompt-injection or DB compromise) could point it at `http://attacker/track.gif` to log every viewer's IP/UA, or trigger a mixed-content warning. Realistic risk is low because `ref` is agent-written to a known asset host, and **this exact pattern already exists** in `app/work/page.tsx:38` and `app/p/[id]/page.tsx:37` — so this is consistent precedent, not a regression.
**Fix (optional hardening):** validate `ref` is `https://` and from the known creative/CDN host before emitting `image` (do it once in the `feed` op so `/work` benefits too).

### MINOR-3 — Privacy enforced in JS branching while `interactions.text` is SELECTed for every row
`tools/db.ts:91` (selects `i.text` for all interactions) + `tools/db.ts:100-110` (only the roast branch emits it)
Current behavior is correct, but the privacy boundary depends on the branch logic rather than the SQL projection — a future edit that emits `i.text` for an inbound/email row would silently leak a private email body, and **the test wouldn't catch it**: `tests/tools/db-feed.test.ts` seeds the private email only in `from_addr` of an `x/out` row, never as the `text` body of an inbound email. 
**Fix:** either don't select `text` for non-`x/out` rows (push the privacy into SQL via a `case`/filtered projection), or add a regression test that seeds an inbound `channel='email' direction='in'` row whose `text` contains a secret and asserts it is absent from the payload.

### MINOR-4 — `stats.revenue_cents` collision between two sources
`tools/db.ts:117` — `stats: { ...(metrics), ...(ledger) }`
`metrics.revenue_cents` = `sum(orders.amount where status='paid')`; `ledger.revenue_cents` = `sum(ledger.amount_cents where kind='revenue')`. The spread order makes **ledger win**, so `stats.revenue_cents` is the ledger figure, not the orders figure. The `/live` counters don't render `revenue_cents` directly (they use `margin_cents`/`orders_paid`), so no visible bug today, but it's a latent inconsistency for any future consumer.
**Fix:** pick one source explicitly, or namespace them (e.g. `revenue_from_orders` vs `revenue_from_ledger`).

### MINOR-5 — Reply branch broader than the spec
`tools/db.ts:104` — `else if (i.direction === 'in')`
Spec-09 / spec-02 define reply as `channel in (x,email) & direction='in'`; the implementation matches **any** inbound channel. Harmless (it only ever emits a title, no body) and arguably more robust, but it's a deviation worth a one-line note or tightening to match the spec.

### NITs
- `tools/db.ts:90` selects `id` from `prospects` but never uses it in the prospect event (only `name`/`created_at`). Dead column.
- `app/live/page.tsx:71` `key={`${e.ts}-${i}`}` mixes a stable field with the array index; fine for this list but index-in-key can cause minor reconciliation quirks on prepend.
- `app/api/feed/route.ts:12` returns **200** (not 500) on error with `error: String(e?.message).slice(0,200)`. The 200-on-error is intentional graceful degradation for the poller (OK), but echoing a raw DB/internal error string to anonymous callers is a small info-disclosure on a public surface (a connection error can include the DB host). Truncated and consistent with `app/api/checkout/route.ts:14`, so MINOR-leaning-NIT — consider a generic public message + server-side log.

### Informational (product/legal, not a code defect)
`/live` surfaces "New target: {name}" the moment a prospect is recorded — i.e. it **publicly names a business as a target before any public roast exists**. This is per spec-09 and these are advertisers from a public ad library (and `/work` already names roasted brands), so it's an intended product decision — flagging only so the team can confirm the reputational/legal posture is acceptable.

---

## Correctness — verified
- Newest-first sort (`tools/db.ts:116`) descending by `ts`; each source `limit 50`, merged, `slice(0,50)` → correct "newest 50 across all sources." Matches `tests/tools/db-feed.test.ts` ordering assertion.
- Event mapping matches spec icons/titles; the `fix` (`channel='fix' direction='out'`) row correctly falls through to the fix branch (roast requires `channel='x'`, the `in` branch is skipped for outbound).
- `run('metrics')`/`run('ledger')` recursion is bounded — `feed` never calls `feed`; both run concurrently inside `Promise.all`. No loop.
- Route: `force-dynamic` + `no-store` on both success and error paths — correct per spec ("never cached").
- Client poller: `clearInterval` on unmount + an `on` guard against post-unmount `setState` — clean React lifecycle, no leak. `ago()` guards clock skew with `Math.max(0, …)`.
- `Date` `ts` serializes to ISO via `NextResponse.json`; client `new Date(ts)` re-parses — consistent.

## Pattern consistency
- `/live` is a **client** component (polling) vs the `/report` and `/work` **server** components — an intentional deviation required by the live-poll spec, mediated correctly through the `/api/feed` route. Acceptable.
- The error-echo and `<img src>`-from-DB patterns both mirror existing code (`checkout` route, `work`/`p` pages), so the diff is internally consistent.

---

## Resolutions (addressed in the same chunk, pre-commit)
- **MAJOR-1 — FIXED.** Route-level 2.5s micro-cache in `app/api/feed/route.ts` collapses concurrent pollers into ≤1 DB hit / ~2.5s. (Placed in the route, not the op, so the DoS surface is covered while `feed` stays pure/testable.)
- **MINOR-2 — FIXED.** `tools/db.ts` emits `image` only when `ref` is `https://` (blocks http tracking / mixed content).
- **MINOR-3 — FIXED.** Privacy pushed into SQL: `case when channel='x' and direction='out' then text else null end` — non-public bodies are NULL at the data layer. Added regression test in `tests/tools/db-feed.test.ts` seeding an inbound `email/in` row whose body must be absent. Green.
- **MINOR-4 — FIXED.** Explicit `stats: { ...metrics, cost_cents, margin_cents }` — no `revenue_cents` key collision.
- **NIT error-echo — FIXED.** Route returns a generic `{events:[],stats:{}}` + `console.error` server-side; no internal string to anonymous callers.
- **NIT prospects.id — FIXED.** Dropped the unused `id` column from the prospect select.
- **MINOR-5 (reply branch) — ACCEPTED.** Intentionally broad; emits a title only (no body), reviewer noted it as "more robust."
- **NIT key-index — ACCEPTED.** List is fully replaced each poll; index-in-key is harmless here.
- **QA M1 (Stripe id in money line) — FIXED.** Money note strips ID-like tokens; verified `+$30.00 — order` (no `cs_test_…`) in the live `/api/feed`.
- **QA M2 (favicon 404) — ACCEPTED.** Cosmetic; no icon asset shipped.
- **Informational (publicly naming un-roasted "New target: {name}") — DEFERRED to operator.** Per approved spec-09; flagging to the user as a product/legal call (easy to anonymize pre-roast if they prefer).

---

# Redesign — brand redesign + on-demand roast (2026-06-26)

Reviewer: senior code + security pass on `git diff main` (committed chunks 1–3 + uncommitted Home/Funnel/Live page files). Scope weighted to the new **public, no-auth file-upload endpoint** `app/api/roast/route.ts` and the public pages that render DB/user data. No code edited.

## Summary
- **1 BLOCKER, 4 MAJOR, 7 MINOR.** The security surface is the unauthenticated, money-spending `/api/roast`. XSS is clean across all pages (React escaping; no `dangerouslySetInnerHTML`; src/href are fixed-scheme or harmless). Checkout price is validated server-side. Score clamping, intake FK order, and the feed's inbound exclusion are correct. The headline risks are **financial DoS / cost amplification** and an **unsolicited-email vector** on the public endpoint, plus a **doubled vision spend** on every roast.

## BLOCKER
- **BLOCKER-1 — `app/api/roast/route.ts:17-55` — Unauthenticated paid endpoint with bypassable rate limiting → unbounded cloud spend (financial DoS).** Every successful POST spends real money on **four** services (Vercel Blob put + OpenRouter vision + OpenRouter Grok + Resend email). The only throttle is `lib/ratelimit.ts`, which is defeated three independent ways: (1) **in-memory per-instance** — on serverless each cold instance has its own `Map`, so the real ceiling is `max × live-instances`; (2) **IP is `x-forwarded-for`.split(',')[0]** (`route.ts:29`) — the leftmost value is client-supplied/spoofable, so an attacker rotates it freely; (3) **the per-email key uses an unverified, freely-rotatable email** (`route.ts:21`, no verification step). There is no CAPTCHA/Turnstile, no proof-of-work, no auth. Net: an attacker can run unlimited vision+Grok cycles at the operator's expense and drain the budget. **Fix:** gate the endpoint behind a CAPTCHA/Turnstile or an email-verification step (process the roast only after the user clicks a link sent to the address), and/or move the limiter to a durable store (Upstash/KV) keyed on a trusted IP source (`@vercel/functions` `ipAddress(req)` or `x-real-ip`, not the spoofable leftmost `x-forwarded-for`). Also check `run('status')` `paused` **before** spending (see MINOR-4) so the kill-switch can actually halt cost.

## MAJOR
- **MAJOR-1 — `app/api/roast/route.ts:51-53` — Unsolicited-email / open-relay vector.** The roast is emailed to whatever `email` the submitter typed, with **no verification of ownership**. An attacker can make AdChad send a "your ad got roasted" email from the brand's domain to any third-party address, with content they heavily influence via the uploaded image. Targeted harassment + sender-reputation/CAN-SPAM exposure. Bounded only by the (bypassable) rate limit. **Fix:** only email an address that has been verified (double-opt-in / click-through), which also closes BLOCKER-1.
- **MAJOR-2 — `app/api/roast/route.ts:39-40` (+ `tools/roast.ts:46`) — Vision model is paid for twice per roast.** The route calls `visionLook(originalUrl)` for score/verdict, then `roast({ image })` which internally calls `describe()` **again** on the same URL. Every roast (legitimate or abusive) pays for two vision passes and eats the extra latency — material on a cost-sensitive path that is already near the `maxDuration = 60` cap (2× vision + Grok). **Fix:** compute the look once and pass it into `roast(opts.look)`, or have `roast()` return `score`/`verdict` so the route doesn't re-`describe`.
- **MAJOR-3 — `app/api/roast/route.ts:19,25` — 5 MB size cap is not enforced before the body is buffered.** `await req.formData()` (line 19) reads and buffers the **entire** multipart body into memory before `file.size` is ever inspected (line 25). There is no `Content-Length` pre-check. On Vercel the 4.5 MB serverless body limit incidentally caps this (see MINOR-5), but on any non-Vercel/self-hosted/`next start` deploy this is unbounded memory per request → trivial OOM DoS. **Fix:** read `req.headers.get('content-length')` and reject >`MAX_BYTES` (with margin) **before** calling `formData()`.
- **MAJOR-4 — Counters count private web roasts as public "ROASTS POSTED".** `tools/db.ts:8-18` `metrics` counts `prospects where stage='roasted'`, and `intake` (`db.ts:78`) sets inbound web prospects to `stage='roasted'`. So `app/page.tsx:20` "ROASTS POSTED" and `app/live/page.tsx:84` "ROASTS" increment for every web upload, even though those roasts are `channel='roast'` (private, **never posted to X**). The public marketing claim "ROASTS POSTED" overstates reality, and "ADS SCANNED" (`page.tsx:19`) likewise includes uploaders the feed timeline deliberately hides. **Fix:** either label them honestly or exclude `email_source='inbound'` from the `roasted`/`prospects` metric counts so the counters match the feed's exclusion. (Severity MAJOR because it's a false public-facing metric; downgrade to MINOR if the operator accepts the framing.)

## MINOR
- **MINOR-1 — `route.ts:24,35` — Client-supplied MIME is trusted; SVG passes.** `/^image\//.test(file.type)` accepts `image/svg+xml`, and the blob is stored `access:'public'` with `contentType: file.type`. A crafted SVG with `<script>` executes if the public blob URL is opened directly. Impact is low (blob is a separate origin from the app, and it's only ever rendered via `<img src>` which won't run SVG scripts), but there's no magic-byte check. **Fix:** sniff magic bytes or disallow `svg`, and/or force a raster `contentType`.
- **MINOR-2 — `route.ts:35,43` — Email/PII embedded in public URLs.** The blob key is `roasts/${slug(email)}-…` and the prospect id is `web-${slug(email)}-…`, so the public Blob URL and the public `/p/<id>` URL both leak a reconstructable form of the uploader's email. **Fix:** use a random token (e.g. `crypto.randomUUID()`) for the blob filename and the prospect id.
- **MINOR-3 — `lib/ratelimit.ts:3-12` — Unbounded `Map` growth.** Keys whose timestamp arrays prune to empty are never deleted, so rotating emails/IPs grows `hits` without bound (slow leak; bounded only by serverless instance lifetime). **Fix:** `hits.delete(key)` when the filtered array is empty, or sweep periodically.
- **MINOR-4 — `route.ts:39-50` — Kill-switch checked after spending.** `paused` is read only at line 50 and only gates the email; the costly vision+Grok+Blob calls already ran. The emergency stop cannot halt spend on this endpoint. **Fix:** check `paused` before the upload/model calls.
- **MINOR-5 — `route.ts:12` — `MAX_BYTES = 5 MB` exceeds Vercel's 4.5 MB serverless request-body limit.** Legitimate 4.5–5 MB images are rejected by the platform with an opaque 413 before the handler runs, never reaching the friendly "image too big" message. **Fix:** set the cap ≤4.5 MB.
- **MINOR-6 — `route.ts:30` — A hit is recorded before the work succeeds.** If vision/Grok throws (500 path), the user already spent a daily quota slot on a failed roast. Acceptable as anti-retry-abuse, but worth noting. **Fix (optional):** only record the hit after a successful roast, or refund on failure.
- **MINOR-7 (observational) — Funnel `paid`/"done" branch is effectively unreachable via the real flow.** `tools/stripe.ts:24` sets `success_url` to `${base}/?paid=1` (Home), not `/p/<id>?paid=1`, so `app/p/[id]/Funnel.tsx:37` (`paid ? 'done'`) only renders if a user manually crafts the URL. `stripe.ts` is unchanged from `main`, but the redesign builds a "FIX DEPLOYED" done screen the Stripe redirect won't land on. **Fix:** point `success_url` at `/p/${prospect}?paid=1`.

## Verified / no-finding (positives)
- **XSS — clean.** No `dangerouslySetInnerHTML` anywhere. All DB/user-sourced values (`name`, `roast_text`, `verdict`, `score`, `ad.copy`, feed `title`/`detail`) render as JSX text children → React-escaped. `<img src>`/`<video src>` from `creative_url`/`e.image` can't execute `javascript:`; feed `e.image` is https-gated in `db.ts:130`. `href`s are fixed-scheme: `https://x.com/i/status/${ref}` (ref can't change the scheme), `/api/checkout?p=${encodeURIComponent(id)}&tier=${number}`, `/p/${prospectId}` — React escapes attribute values, so no breakout.
- **Checkout price — server-validated.** `tools/stripe.ts:3-12` maps `tier` via a server-side `TIERS` table with fallback to `$5`; tampering `?tier=` can't set an arbitrary price. Funnel order-bump 5↔12 is consistent (`Funnel.tsx:46`, "+$7").
- **Score clamping — correct.** `tools/vision.ts:72-74` clamps to integer 0–100 with a 30 default on non-finite. `0` survives the `?? null` / `!= null` checks in Funnel/RoastBox.
- **Intake FK order — correct.** `db.ts:77-80` inserts `ads` then `prospects` before `scores` (which FKs both); `on conflict (id) do nothing` keeps the FK targets present.
- **Feed inbound exclusion — correct.** Prospect timeline filters `coalesce(email_source,'')<>'inbound'` (`db.ts:107`); the web `channel='roast'` interaction falls through all four emit branches (`db.ts:123-130`) so it's never surfaced. (Note: relies on channel staying `'roast'`; if it ever became `'x'` it would leak — defense-in-depth only.)
- **Rate-limit ordering — correct.** The `hit()` check (`route.ts:30`) runs **before** the blob upload and the vision/Grok spend. Money is not spent before the limit check (the limit is just bypassable — see BLOCKER-1).
- **Error handling — no info disclosure.** The catch returns a generic 500 and `console.error`s server-side; no stack/internal string reaches the client (`route.ts:56-58`).

### Resolutions (addressed pre-commit)
- **BLOCKER-1 — MITIGATED (not fully eliminated).** Financial-DoS is now bounded by a **durable, DB-backed daily cap** (`DAILY_CAP=40`, `db roastquota` counts today's `channel='roast'` interactions; checked *before* any spend) + per-email(3)/per-IP(12) in-memory throttle on a **trusted `x-real-ip`**. Worst-case ≈40 paid roasts/day (~$2-4). A CAPTCHA / email-verification is the production hardening — **flagged to the operator**, not added mid-build (needs keys + UX). Logged as a known residual.
- **MAJOR-1 — FIXED.** Auto-email REMOVED — the roast is shown inline (RoastBox) + the `/p` link; we never email an unverified address. Open-relay/harassment vector closed.
- **MAJOR-2 — FIXED.** `roast()` accepts a precomputed `look` (`roast.ts`); the route does vision ONCE and passes it in → no double vision charge.
- **MAJOR-3 — FIXED.** `content-length` checked (413) BEFORE `req.formData()` buffers; cap lowered to 4 MB (< Vercel's 4.5 MB).
- **MAJOR-4 — FIXED.** `intake` sets `stage='web'` (not `'roasted'`) and `metrics` excludes `email_source='inbound'` from `prospects`/`roasted` → public counters reflect agent activity only.
- **MINOR-1 — FIXED.** Mime tightened to `image/(png|jpe?g|webp|gif)` — SVG rejected.
- **MINOR-7 — FIXED.** Stripe `success_url` → `/p/<prospect>?paid=1` (and cancel → `/p/<prospect>`) so the Funnel DONE screen is reachable via the real flow.
- MINORs 2/3/5/6 (Blob-URL PII reconstructability, ratelimit map eviction, paused-after-spend [moot — email removed], hit-before-success) — ACCEPTED for the demo; noted.
Verified: `tsc=0`, 12 tests green, endpoint re-QA'd (score 68, real roast, no email), `roastquota`→3/40.

## fulfillment worker chunk — 2026-06-29
Scope: tools/fulfill.ts, scripts/fulfill-worker.ts, tests/tools/fulfill.test.ts, db/schema.sql
- **MAJOR — unbounded re-spend on retry** (tools/fulfill.ts): fix() (paid gpt-image-2 gen) ran before send(); a failed send left the order unfulfilled → 30s poll re-ran → re-generated every cycle, burning money. **FIXED**: persist generation before send, reuse on retry, book cost once, set delivered_at immediately after send. New test `a failed send does not re-pay for generation` (fixCalls===1) covers it. PASS.
- MINOR — send→record crash window can double-email on retry. WONTFIX (documented; generation already persisted so retry is free; record-before-send risks silent non-delivery, which is worse).
- MINOR — cost is a flat 6¢ estimate. Acceptable for MVP; note tagged "(est)" in the ledger.
Verdict: PASS after MAJOR fix. Tests green (2/2).

## spec-14 Launch campaign — 2026-06-29 (high-effort, 3 finder angles)

| # | Sev | Finding | Resolution |
|---|-----|---------|------------|
| 1 | BLOCKER | Inline `fulfill()` races the standalone fulfill-worker (30s poll) on the same comped order → double gpt-image spend + double public fix reply | FIXED: dropped inline fulfill; `run()` only comps the order, the single fulfill-worker drains it (same as paid orders). `tools/launch.ts` |
| 2 | BLOCKER | Comped `source='launch'` order inflates public "SALES"/"FIXES SOLD" count (`db metrics orders_paid`, no source filter) | FIXED: `orders_paid` + `revenue_cents` now exclude `coalesce(source,'')='launch'`. `tools/db.ts:35-36` + regression test |
| 3 | MAJOR | Dedup marker written AFTER the public roast → crash window re-roasts; comment claimed otherwise | FIXED: claim-first (marker before roast). `tools/launch.ts` |
| 4 | MAJOR | Dedup marker (`direction='in'`) rendered in the /live feed as "<brand> replied" (interactionEvent generic inbound branch) | FIXED: dedicated `channel='launch'` marker + explicit `interactionEvent` guard returns null. `tools/db.ts:11` + regression test |
| 5 | MAJOR | Unscoped dedup query `where ref=… and direction='in'` could collide with stripe/email inbound refs | FIXED: query scoped to `channel='launch'`. `tools/launch.ts` |
| 6 | MAJOR | `me()` reinvents the TwitterApi client block (4th copy) + a per-beat API round-trip for a static handle | FIXED: `process.env.X_HANDLE || 'adchadofficial'` (matches xpost.ts fallback); dropped TwitterApi import. `tools/launch.ts` |
| 7 | MINOR | `mapReplies` silently drops all replies if author-expansion empty → campaign no-ops looking healthy | FIXED: `replies()` logs a stderr warning when tweets resolve to 0 handles. `tools/xread.ts` |
| 8 | MINOR | `launch run` → fulfill's `console.log` breaks the one-JSON-line CLI contract | FIXED as a consequence of #1 (no inline fulfill from the CLI path) |
| 9 | LOW | `launch_tweet_id` on the `control` singleton = one-campaign-only | WONTFIX: user explicitly chose "drop the id into the control row — no new table" |
| 10 | LOW | >100 image-replies/beat dropped (no since_id cursor) | WONTFIX (now): documented ponytail ceiling; low realistic volume for a first launch |
| 11 | LOW | Pre-existing: `fulfill.ts` re-posts the fix if the `delivered_at` update fails after the X post | OUT OF SCOPE: pre-existing in fulfill.ts, not this diff. Flagged for retro |

Evidence: `npx vitest run tests/tools/launch.test.ts` → 10 passed (incl. feed-guard + metrics-exclusion regression tests); `npx tsc --noEmit` exit 0; feed/halls/db tests green (no regression).

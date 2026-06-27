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

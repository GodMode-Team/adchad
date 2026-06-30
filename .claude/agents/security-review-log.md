
## fulfillment worker chunk — 2026-06-29
- SQL: all parameterized (sql`…${}`) — no injection. Reviewed every query in tools/fulfill.ts.
- Trigger gating: only orders with status='paid' are fulfilled; status is set by the Stripe webhook AFTER `constructEvent` signature verification → an attacker cannot inject a fulfillable order without DB creds.
- Email: `to` is the Stripe-verified buyer_email; body is plain text (Resend `text:`), no HTML/template injection from model/DB-sourced copy.
- No new auth/network surface (poller, not an endpoint). No secrets logged. Integer cents only (no float money).
Verdict: no findings.

## spec-14 Launch campaign — 2026-06-29

Scope: tools/launch.ts (new), tools/xread.ts, tools/db.ts, scripts/tool.ts, db/schema.sql.

**Result: no HIGH or MEDIUM findings.**

Traced each category against the diff:
- SQLi — all queries are parameterized `postgres` tagged templates; untrusted X data (reply.id) only enters parameterized inserts. None reachable.
- Search-query string `conversation_id:${tweetId}` — tweetId is digits-only (`tweetIdOf` sanitizes on `arm`), and targets the X API, not a security boundary.
- Secrets — env-sourced, never logged; no hardcoded credentials.
- Data exposure — the `channel='launch'` feed guard + the metrics source-filter REDUCE public exposure; marker holds only a public tweet id (no PII).
- Authz/escalation — comped order is hardcoded `tier=5, amount=0`; no new auth surface.
- Injection/deserialization/XSS — no shell, no JSON.parse of untrusted input, no HTML rendering.
- Unbounded free fixes / spend — by design (engagement goal); DoS/resource-exhaustion class, excluded from scope.

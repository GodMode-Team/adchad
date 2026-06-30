
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

## spec-15 `@adchad` summon — 2026-06-30

Scope: tools/mention.ts (new), tools/xread.ts (adTweetOf/mapMentions/mentions), tools/xroast.ts (replyTo + self-guard), tools/db.ts (interactionEvent), scripts/tool.ts, skills/engage/SKILL.md.

**Result: no HIGH or MEDIUM findings.**

Traced each category against the new untrusted data-flow (X API → `mentions()` → `adTweetOf` → `xroast`/`run`):
- SQLi — every new query is a parameterized `postgres` tagged template (`sql\`… ref=${m.id}\``); the X-supplied mention/tweet ids only enter parameterized inserts/selects. The widened dedup `channel in ('launch','mention')` uses string literals, not input. None reachable.
- Injection into the public reply — `@handle` is X-constrained to `[A-Za-z0-9_]` (buildTweet, no break-out); the mention TEXT is ignored in v1 (never fed to vision/Grok); roast body is model-generated. (Untrusted→LLM-prompt is an explicit exclusion regardless.)
- Arbitrary-tweet roast — an attacker can make the bot roast any IMAGE tweet they reply `@adchad` to (adTweetId = the referenced tweet). This is the designed feature, not an access/data-breach vuln; mitigated by the self-roast guard (won't roast our own tweets), the no-image→nudge path, the good-ad coach path, and `control.paused`. Abuse/harassment surface noted as LOW/product-safety, outside the injection/authz/crypto/data-exposure scope.
- Path traversal — the mention flow only ever passes `xroast` an X media URL (https), never a local path, so `vision.toImageUrl`'s file-read branch is unreachable here.
- Secrets / crypto / authz — no new secrets; `X_HANDLE` is a trusted env var; `import('../tools/mention')` is a fixed literal; no new auth surface (public X bot, consistent with the existing no-auth funnel); the mention path comps NO order (no money/privilege change).
- Data exposure — the `channel='mention'` marker is excluded from `interactionEvent` (off /live) and holds only a public tweet id (no PII).
Verdict: no findings.

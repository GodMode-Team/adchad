# Spec 01 — Tools (the agent's hands)

**Goal:** Thin, single-purpose CLIs the skills invoke. **No business logic** — just live I/O, each emitting one JSON line. This is where the TDD lives (skills are markdown, validated by Manual QA).

**Contract** (`tools/*.ts`, each runnable `pnpm tool <name> [args]`, prints JSON)
- `foreplay scan --query Q --n N` → `{ads:[{id,advertiser,link_url,creative_url,copy,niches,...}]}` (live Foreplay).
- `enrich --link URL --name N` → `{website,email,email_source,x_handle,segment}` (scrape + MX + Brave).
- `xpost --text T [--image URL] [--handle H] [--reply ID]` → `{tweetId,url}` (X API v2; @-tag only if handle; replies into a thread when `replyToTweetId`/`--reply` is set).
- `xread [--mentions] [--since ID]` → `{items:[{id,from,text,...}]}` (mentions/replies/DMs).
- `xroast --tweet URL|ID` → `{prospectId,roastTweetId,salesUrl}` (roast a tweet: audits the ad image, posts the savage roast as a **public reply** to it, persists the prospect + roast-reply id, returns the `/p/<id>` sales link).
- `email send --to A --subject S --body B` / `email read` → `{id}` / `{items:[...]}` (Resend + inbox).
- `stripe checkout --prospect P --tier 5|12|49` / `stripe webhook` → `{url}` / fulfillment trigger.
- `creative --headline H --body B --cta C` → `{imageUrl}` (Nano Banana → `public/fixes`).
- `db <query|writer>` → CRM/ledger reads + writes (prospects, interactions, orders, fixes, ledger, control).

**Failing tests** (`tests/tools/*.test.ts`, live, no mocks) — one per tool, each asserts a **real** effect:
1. `foreplay scan` → ≥1 real ad. `enrich` → email and/or x_handle or `unreachable`.
2. `xpost` → real fetchable `tweetId`; `email send` → real Resend id; `creative` → real `image/*` bytes.
3. `stripe checkout` → real test-mode session ($ matches tier); `db` round-trips a row.

**Done when:** every tool does one real thing, JSON out, independently green.

**Deps:** all `.env.local` keys. Blocks: every skill (they call these).

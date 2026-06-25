# Spec 02 — Enrich (website → email + X)

**Goal:** Turn a raw prospect into a reachable one: find website, business email, and a *site-linked* X handle + segment. No mocks.

**Contract** (`lib/enrich.ts`)
- `enrich(prospect): Promise<{ website; email; email_source; x_handle; x_followers; segment }>`
- `website` = registrable **root domain** of the ad's `link_url`; if the ad has no real link (`fb.me`/social), resolve via **name→website search** (Brave API; optional key — free DDG is bot-blocked).
- Scrape root homepage + `/contact` → `email` (role@ + domain-match; drop noreply) tagged **scraped**; else MX-verified **`info@domain`** tagged **guessed**. `x_handle` = an x.com link found **on their own site** (never guessed).
- If `x_handle`: fetch follower count via the **X API** (users lookup); `active` if followers ≥ threshold + a recent post.
- `segment`: **A** = active site-linked X · **B** = email but no active X · **unreachable** = neither.

**Failing test** (`tests/enrich.test.ts`, live)
1. For a real ad with a `link_url`, `enrich` fetches the site and returns an `email` and/or `x_handle` (or marks `unreachable`).
2. Any returned `x_handle` is actually linked from that site (assert the fetched HTML contains it) — never guessed.
3. `segment ∈ {A,B,unreachable}`; `A` requires a non-null active X handle.

**Done when:** prospects carry website/email/x_handle/segment; site-linked-only X is enforced.

**Deps:** `link_url` from Spec 01, web fetch, MX (dns), X API (follower check), Brave search (optional). Blocks: 03, 04, 07.

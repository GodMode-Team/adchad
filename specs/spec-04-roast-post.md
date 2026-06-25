# Spec 04 — Roast → X post + owner email

**Goal:** Generate the roast, post it publicly to X (meme/screenshot of the bad ad, @-tag if Segment A), AND email the owner the roast + offer. Both channels, every qualified prospect.

**Contract**
- `lib/roast.ts` → `roast(prospect, ad): Promise<{ text; hook }>` — the model via the new `roast` skill (mean-but-useful AdChad voice; names the ad's real weakness from its score).
- `lib/xpost.ts` → `xpost({ text, imageUrl, link, handle? }): Promise<{ tweetId; url }>` — **official X API v2** via `twitter-api-v2`: download `imageUrl` → `v1.uploadMedia` → `v2.tweet` with media + link; @-tags `handle` only if Segment A.
- `lib/email.ts` → `outreachEmail(prospect, roast, tweetUrl): Promise<{ id }>` — Resend, **value-first**: leads with the audit we already did (the public roast as proof) → "here's the fix for $5", links to `/?p=id`.

**Failing test** (`tests/roast.test.ts`, live)
1. `roast()` returns non-empty text referencing the ad's actual weakness (not generic) + a hook.
2. `xpost()` posts to a real test X account → real `tweetId`, fetchable, text contains `/?p=id`; Segment-A includes the `@handle`, Segment-B does not.
3. `outreachEmail()` returns a real Resend id; body contains the tweet link + the `/?p=id` purchase link.

**Done when:** a real roast tweet exists AND the owner is emailed the roast + offer.

**Deps:** model + `roast` skill, X API creds (user-context), Resend (verified domain), enriched prospect. Blocks: 07.

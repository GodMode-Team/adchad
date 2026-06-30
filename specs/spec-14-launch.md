# Spec 14 — Launch plan (the engagement-bait tweet)

**Goal:** One launch tweet drives a flood of replies; AdChad auto-roasts every ad-looking image and delivers the $5 fix **for free, in-thread** — fully unattended.

**The tweet (copy):**
> The first 100 people to RT + comment their ad below get a free roast AND a free $5 unfuck (must be following).

The 100 / RT / follow lines are **bait, not enforced.** Real mechanic: *any* reply with an image that looks like an ad → public roast + free fix.

**Deliverable** (mostly orchestration of existing primitives + one new free-fix path)
- **Launch tweet:** the team posts it by hand, drops the id into the **control row** (alongside the kill-switch — no new table). Empty = campaign off.
- **Watch:** new `xread --replies <launchTweetId>` mode — X search-recent on `conversation_id:<id>` with media expansions (current `xread` does neither; needs a **paid X tier** for `conversation_id:` + media). Poll on the engage cron. Dedup on reply id — never process a reply twice.
- **Roast everything with an image:** no "is it an ad" gate — just roast it (it'll be ad-shaped). Two guards only, not a gate: skip replies with **no image** (nothing to roast), and skip **our own @handle** (else the bot roasts its own fix-creative reply → infinite loop).
- **Roast:** `xroast --tweet <replyId>` (already: audits image → public roast reply → persists prospect + `/p/<id>`).
- **Free fix:** comp the **exact** `fulfill` $5 path with no Stripe — insert a `tier=5, status='paid', amount=0, source='launch'` order row and let the **existing single fulfill-worker drain it** (same as a paid order → one fulfiller, no double-post race). `fulfillOrder` books only cost, never revenue ($0 revenue / real cost), and the fix lands as a public reply in the thread. (`source` is a new `orders` column, excluded from the public sales count; the launch tweet id lives on `control.launch_tweet_id`; the dedup marker is an internal `channel='launch'` interaction, off the /live feed.)
- **Runner:** `pnpm -s tool launch run`, invoked each beat by the engage cron (every 15m). Arm with `launch set --tweet <id>`, disarm with `launch off`.
- **Kill-switch only:** no hard cap — goal is followers/engagement/hackathon, not money, so let it run. `db status` paused stops all processing silently (the one safety valve).

**Validated when** (Manual QA — live)
1. Reply to the launch tweet with a real ad image → public roast reply, then a free-fix reply with real copy + creative, within the cron beat.
2. A text-only reply → skipped (no image); the bot's own fix-reply → skipped (own handle, no loop).
3. The same reply on the next cron beat → not reprocessed (dedup).
4. Ledger shows `revenue=0`, real gen cost; kill-switch paused → nothing posts.

**Done when:** post the tweet, walk away, and every ad reply comes back roasted + fixed — no human, no payment, bounded spend.

**Deps:** [[spec-04-engage]] (reply watch), [[spec-03-roast]]/`xroast`, [[spec-05-fulfill]] (free-fix path), [[spec-01-tools]] (xread, vision, creative, db).

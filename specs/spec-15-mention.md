# Spec 15 — `@adchad` summon (mention → roast + unfuck link)

**Goal:** Tag **@adchad** on any bad ad and get a public roast + the $5 unfuck link in-thread, unattended — whether you
*reply to a live X ad* and tag Chad, or *post a screenshot* of one. Either way Chad roasts **that ad**. No "is it an
ad?" gate: tagged → roasted (a genuinely good ad gets `roast.ts`'s coach path, so always-roast is safe).

**The image to roast** (the one new wrinkle — the mention often has no image of its own; first hit wins):
1. Image **on the mention** → roast it (a screenshot of an ad).
2. Else image on the **tweet it replies to / quotes** (`referenced_tweets`) → roast it (a live X ad they tagged Chad under).
3. Neither → one nudge reply ("Drop the ad's screenshot or tag me under the ad 👇"), marked handled so Chad never nags twice.

The summoner only ever types **`@adchad`** (+ optional words) — they **never** tag the advertiser; Chad derives
everything from the reply chain. @-tag + prospect = the **author of the tweet the image came from** (the advertiser =
the buyer, so the $5 link reaches who can pay); Chad **replies to the mention**, so summoner + owner both see it. v1
**ignores** the optional words (Chad just roasts the ad) — feeding them to the roast is a one-param steer later, but
it's untrusted LLM input (prompt/link-injection), so defer it.

**Deliverable** (thin runner over existing primitives — mirrors `tools/launch.ts`):
- **Watch:** upgrade `xread.mentions` to expand media + the replied-to/quoted tweet + handles (`attachments.media_keys`,
  `referenced_tweets`, `expansions: referenced_tweets.id[.attachments.media_keys] + author_id`, `media.fields`,
  `user.fields`). Today it returns only `id/text/author_id` — nothing for the resolver to use.
- **Resolve:** pure `adTweetOf(mention)` → the tweet id that holds the ad (the mention's own id if it has media, else
  the tweet it replies to / quotes, else `null`); no network, unit-tested. `mapMentions` joins `@handle`s exactly like
  `mapReplies`. xroast then fetches that tweet's image+author itself — we never hand-resolve media URLs or parent authors.
- **Roast:** extend `xroast({ tweet, replyTo? })` — `tweet` is the tweet whose image+author to roast, `replyTo`
  (defaults to `tweet`) is where the reply lands; the runner passes `{tweet: adTweetId, replyTo: mentionId}`. Plus a
  self-guard: xroast refuses to roast our **own** tweet (kills the loop when a 3rd party tags us under our own image).
- **Runner:** `pnpm -s tool mention run` — one beat = fresh mentions → per mention: skip self → claim-dedup → resolve →
  roast (or nudge). Same shape/guards as `launch.run`; wire into the **engage 15m cron** beside `launch run`.
- **Dedup:** claim-first `interactions channel='mention' ref=<mentionId>` **before** roasting (a crash mid-roast can't double-post). Same pattern as launch.
- **Always a $5 sell:** the roast appends the `/p/<id>` link (`xroast` already does) — never a free comp. Free fixes stay
  exclusive to the launch thread ([[spec-14-launch]], `source='launch'`).
- **Guards (two, not a gate):** skip our **own** @handle (else Chad roasts his own fix reply forever — spec-14's loop); dedup on mention id.
- **Kill-switch only:** `control.paused` stops all posting (`xroast` already refuses while paused); no per-user cap.

**Folds spec-14, doesn't fork it:** same core (resolve → roast → dedup → self-skip → kill-switch), two pluggable
sources — this **mentions timeline** (anywhere, but must tag @adchad; a *direct* reply to the launch tweet auto-tags it)
and spec-14's **`conversation_id` sweep** (one thread, catches the **untagged/nested** replies the timeline misses).
Build one shared handler; the resolver upgrades the sweep too (a reply quoting the ad with no image of its own now roasts).

**Validated when** (Manual QA, live — drive the per-mention primitives directly; our one X login can't @-mention itself):
1. Reply to a real X ad with "@adchad roast this", no image of your own → roasts the **parent ad**, @-tags its owner, $5 link in-thread.
2. Tweet a **screenshot** + "@adchad" (no parent) → roasts the attached image, tags the poster.
3. "@adchad", no image, no ad parent → one nudge; next beat doesn't nag (dedup).
4. Same mention next beat → not reprocessed; our own reply → skipped (no loop); kill-switch paused → nothing posts.

**Done when:** tagging @adchad on any ad — screenshot or live tweet — comes back roasted with the unfuck link, no human.

**Deps:** [[spec-04-engage]] (mention watch + 15m cron), [[spec-03-roast]] / `xroast`, [[spec-01-tools]] (xread, vision, db). Sibling of [[spec-14-launch]].

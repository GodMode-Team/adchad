# Manual QA — `/live` feed (spec-09)

Driven against the real Next dev server (`pnpm dev`, :3001) + the live Neon DB.

## PASS
- **Endpoint shape** — `GET /api/feed` → 37 events, `stats` has all keys incl. `margin_cents`. Evidence: `curl :3001/api/feed` → `events: 37 | stats keys: [...margin_cents]`.
- **Privacy invariant (PUBLIC page)** — PII scan of the raw response found **zero** matches for email / `from_addr` / `subject` / `buyer_email`. Evidence: `curl :3001/api/feed | grep -iE '<email>|from_addr|subject|buyer_email'` → no matches. Inbound replies render as `💬 a brand replied` with **no body**.
- **Client render** — `/live` populated client-side with real activity: 31 Prospects · 1 Roast · 2 Sales · $60.00 Margin; 🔍 targets, 🔥 the VIO Med Spa roast (full text), ✅ delivered fix, 💬 reply, 💸 money. Evidence: page snapshot uids 1_2…1_124.
- **Mobile 390px** — dark theme, ● LIVE marker, 4 counter cards, scrollable timeline, no overflow. Evidence: `pipeline-runs/screenshots/2026-06-26-live/live-mobile-390.png`.

## MINOR (to address)
- **M1 — Stripe ID leak (cosmetic/hygiene):** money lines render the raw note, e.g. `💸 +$30.00 — order cs_test_a1Mp8sJgG…`. Not a secret/PII, but a public page shouldn't surface internal Stripe session IDs. Fix: sanitize long ID-like tokens out of the ledger note in the `feed` op. → convert to a self-healing test (money event titles contain no `cs_`/`pi_`-style token).
- **M2 — favicon 404:** one console error, `Failed to load resource: 404`, a missing static icon. Cosmetic. Evidence: `list_console_messages` msgid=74.

No BLOCKERs. The end-to-end "live roast appears within ~5s" is verified-by-construction (the `feed` op surfaces a `channel='x'/out` interaction — see the VIO roast in the timeline) and will be re-confirmed in the live demo when the box posts a fresh roast.

---

## Prospect spiral-guard (spec-02 #4) — PASS

Drove the **real agent on the box** (`hermes -z "/prospect find a target in the zxqvwklmn nonexistent niche"`) after deploying the hardened `skills/prospect/SKILL.md` to `/root/adchad` + `~/.hermes/skills/adchad/prospect`. Kill-switch ON.

**Final answer (literal):**
> "No ads found for 'zxqvwklmn nonexistent niche' or 'zxqvwklmn'. No target to roast. Pick a real niche (med spa, dentist, HVAC, gym, lawn care) or specify another?"

This proves the spec-02 #4 contract: it tried the full query → **broadened once** to the bare term (`zxqvwklmn`) → still empty → reported "no ads found" and **STOPPED** (no file-cat'ing / no spiral). Wall-clock 3m40s, CPU 12.9s — the time is slow non-streaming Nemotron round-trips, not a runaway loop (the old failure was 9 min+ climbing toward the 150-turn cap). `max_turns=50` remains the deterministic backstop.

---

## On-demand roast endpoint (spec-11) — PASS

`POST /api/roast` driven with a real ad screenshot (`public/originals/COf1oofGrqI8AWQvVTam.png`) + a unique email, against the dev server + paused kill-switch.

**Response (node/JSON.parse, 699 B, valid):** `score: 65`, `verdict: "Clear message and offer, but lacks strong CTA and brand visibility."`, `roast: "This ad is sloppy, low-effort garbage with zero pull…"`, `prospectId: web-qa-roast-…`, `originalUrl: https://…public.blob.vercel-storage.com/roasts/…` (uploaded to Blob).
**Persistence:** `GET /p/<prospectId>` → **HTTP 200**, renders the roast ("roasted you") — so the `intake` op wrote ad+prospect+roast(channel='roast')+score and `db page` surfaces them.
**Kill-switch:** paused → no email sent (verified by branch; the roast still returns to the uploader, which is the product).

Validation + rate-limit covered by `tests/ratelimit.test.ts` + input guards (mime/5 MB/email). Watch item: the gemini score (65) runs generous vs the roast's savagery — tune the score prompt harsher if brand wants lower numbers.

---

## Brand redesign — Home / Funnel / Live (spec-10) — PASS

Driven on the dev server (:3001) via chrome-devtools; full project `tsc=0`; all three pages 200, no error markers.
- **Home (`/`, desktop):** faithful to the mockup — pink ticker, green "YOUR META ADS ARE COOKED." hero + the real upload `RoastBox`, EXHIBIT-A markup, FOUR STEPS, $0/$5/$12/$49 pricing, "WATCH ME RUN THE BUSINESS" with **real** counters (33 scanned · 1 roast · 2 sales · $60.00 margin), pink CTA, footer. **Zero console errors.** `pipeline-runs/screenshots/2026-06-26-redesign/home-desktop.png`.
- **Funnel (`/p/<id>`, mobile):** real VIO hydrafacial ad + real roast + real **score 65/100** + UNFUCK→$5. `funnel-mobile.png`.
- **Live (`/live`, mobile):** P&L tiles (REVENUE/SPEND/MARGIN) + SCANNED/ROASTS/SALES counters + accent-bordered timeline + NEW badge + score chips, real `/api/feed`. `live-mobile.png`.
- **QA finding (FIXED):** on-demand web-upload prospects (`email_source='inbound'`) leaked into the PUBLIC feed as "New target: unknown · score N". Fixed the `feed` op to exclude inbound prospects → verified **0 leaked**, 10 db tests still green.


## spec-14 Launch campaign — 2026-06-29 (real CLI + live X API, read/no-post)

Drove the real `pnpm -s tool` CLI against the live DB + live X API. Public-posting e2e (actual roast/fix on a real image reply) is GATED on user go-live + an image reply existing — not run.

| Check | Command | Result |
|---|---|---|
| X tier supports conversation_id+media search (key unknown) | `xread --replies 2071805835890810934` | `{"items":[]}` — no 403/error → tier OK; tweet has no image replies yet |
| Live extraction `res.tweets`/`res.includes.users` + `mapReplies` join | scratch search `has:images dog` | `rawTweetCount:10, rawUserCount:10, resolvedItems:10` — handles resolved correctly |
| Arm via URL (round-trip) | `launch set --tweet https://x.com/.../2071805835890810934` → read control | `launch_tweet_id:"2071805835890810934"` |
| FULL armed run vs real empty reply set (whole path, posts nothing) | `launch run` (armed, kill-switch off) | `{"processed":[],"skipped":[],"errors":[]}` |
| Kill-switch guard | `db pause` → `launch run` | `{"reason":"paused"}` no-op |
| Disarmed guard | `launch run` (disarmed) | `{"reason":"disarmed"}` no-op |
| State restored | `db resume` + `launch off` | `{paused:false}`, `launch_tweet_id:null` |

UNVERIFIED (gated): live public roast reply + fulfill-worker fix reply on a real image reply — needs (a) an ad-image reply on the tweet and (b) go-live authorization. Component tools (xroast, fulfillOrder/fulfill-worker) are pre-existing + covered by their own live tests; orchestration that calls them is covered by the 10 launch.test.ts cases (stubbed roast, real comped-order shape asserted).

## spec-15 `@adchad` summon — 2026-06-30

Driven against the live X API + the shared Neon DB. Did NOT post any public tweet (overnight, no sanction for unsanctioned public roasts) — the real-artifact checks below are all read-only or guaranteed no-ops.

| Check | Command | Result |
|---|---|---|
| Live mention read through new `mentions()` (paid tier OK, no 403) | `xread --mentions` | 15 items, all shaped `{id, handle, text, created_at, adTweetId}` — the upgraded shape resolves against the live API |
| `adTweetOf` own-media branch (screenshot → roast the mention itself) | same output | media tweets resolve `adTweetId === id` (e.g. `2071822865360429318`) |
| `adTweetOf` reply branch (no own media → roast the PARENT ad) | same output | reply mentions resolve `adTweetId` = the parent ad id (e.g. mention `2071822416343372076` → ad `2071822350744510680`; `…797185273110856` → `…796738919457023`) |
| Self-skip validated on real data (essential — timeline is full of our own roast/fix posts) | `mention run` | `{"processed":[],"skipped":[15× "self"],"errors":[]}` — every `handle:'adchadofficial'` item skipped; **no post, no spend, no order comped** |
| Kill-switch guard (real CLI) | `db pause` → `mention run` → `db resume` | `{...,"reason":"paused"}` (returns before any X call); prod restored to `{paused:false}` |
| DB-effect paths (claim marker written, NO order comped, cross-source dedup vs launch, off-/live-feed marker) | live-DB unit suite | `mention.test.ts` 17 + `launch.test.ts` 11 pass against the real shared Postgres (house style) |

UNVERIFIED (gated): the live PUBLIC roast/nudge reply on a real third-party `@adchad` mention — proving `xroast({tweet, replyTo})` threads the roast under the mention while @-tagging the AD's owner, appends the $5 `/p/<id>` link, and comps no order. Our only X login is `@adchadofficial`, which the self-skip deliberately filters (no self-roast loop), so a third-party account is required — the exact gap spec-14 declared. The `replyTo` wiring + the no-order guarantee are unit-tested (live DB, stubbed roast) and read-verified; the roast/xpost component tools are pre-existing and live-verified by spec-14.

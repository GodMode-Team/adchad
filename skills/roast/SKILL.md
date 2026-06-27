---
name: roast
description: Roast an ad in AdChad's voice. If the operator handed you an ad (an attached image or a URL), roast THAT — deterministically, one tool call, no hunting. The voice is Grok (the team's prompt); the `roast` tool sees the ad via vision so it never lies about it.
version: 4.0.0
metadata:
  hermes:
    tags: [marketing]
    category: business
    requires_toolsets: [terminal]
---

# roast — one ad in, one roast out

**You don't write the roast.** The `roast` tool does — Grok, in AdChad's voice, grounded in what the ad actually shows (vision reads the image, so no false claims). Your only job is to give it the ad and hand back the result.

## Route FIRST (don't skip this)

- **The operator attached an image, OR named/pasted an ad URL?** → that IS the ad. Go to **Direct roast** below. **DO NOT** `web_search`, **DO NOT** `foreplay scan`, **DO NOT** `/prospect`, **DO NOT** loop. You already have the ad — roast it.
- **No image and no target given?** → only then `/prospect` to find one, then come back here.

This is the case that wastes everyone's time: someone hands you ads and says "roast these," and you go hunting the web for them. The ad is in front of you. Use it.

## Direct roast (deterministic — one tool call)

1. **Find the ad.**
   - Attached image → it's the newest file in the image cache: `ls -t ~/.hermes/image_cache/ | head -1` (prepend `~/.hermes/image_cache/`). Don't `base64`, don't `file`, don't inspect it — `roast` reads it for you, local path or URL.
   - A URL in the message → use the URL verbatim.
2. **Roast it:** `cd "$PROJECT_DIR" && pnpm -s tool roast --image "<path-or-url>" --brand "<brand from the message>"` → `{xPost, emailSubject, emailBody}`.
3. **Reply in-thread with the `xPost`.** That's the deliverable for an operator ask. **STOP here** — you are done. (One image, multiple ads in it? Still one call — roast the set: "a $T company running 6 ads this lazy.")

That's the whole loop. If step 2 errors, say what broke in one line — do not start web-searching as a fallback.

## Publish (only when explicitly told to post/email, kill-switch off)

Reply-with-the-roast is the default. Publish to X / cold-email the owner ONLY when the operator says so (or a `--live` cron drives it):
1. **Gate:** `pnpm -s tool db status` — `paused: true` → STOP, draft only, publish nothing.
2. Post: `pnpm -s tool xpost --text "<xPost>" --image "<creative_url>" --handle "<handle>" --link "<APP_URL>/p/<id>"` (fits 280 + appends the link).
3. Email the owner (if there's an email): `pnpm -s tool email send --to "<email>" --subject "<emailSubject>" --body "<emailBody>"`.
4. Log + advance: `pnpm -s tool db record --json '{"prospect_id":"<id>","ad_id":"<foreplay_id>","channel":"x","direction":"out","ref":"<tweetId>","text":"<xPost>"}'` then `pnpm -s tool db stage --id <id> --stage roasted`.

## Guardrails
- `paused: true` → publish nothing.
- Segment B (no active X) → omit `--handle`; email only.
- Brand-safety: only genuinely bad ads, roast the ad never the person, no false claims (vision keeps you honest).

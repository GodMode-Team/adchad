---
name: roast
description: Roast a chosen ad in AdChad's voice and publish it — the savage X post + the cold email. The voice is Grok (Caleb's prompt); you operate the publish.
version: 3.0.0-grok
metadata:
  hermes:
    tags: [marketing]
    category: business
    requires_toolsets: [terminal]
---

# roast — voice → publish

**You don't write the roast.** The `roast` tool does — Grok, in AdChad's voice, grounded in what the ad actually shows (it sees the ad via vision, so no false claims). You operate the publish.

## Procedure
1. From `/prospect`: the chosen ad's id + `creative_url`, the prospect's segment, handle/email, and business name.
2. Generate it: `pnpm -s tool roast --image "<creative_url>" --handle "<handle, if Segment A>" --brand "<business name>"` → `{xPost, emailSubject, emailBody}`.
3. **Gate:** `pnpm -s tool db status` — if `paused: true`, STOP (draft only; publish nothing).
4. Post: `pnpm -s tool xpost --text "<xPost>" --image "<creative_url>" --handle "<handle>" --link "<APP_URL>/p/<id>"` (the post tool fits it to 280 + appends the link).
5. Email the owner (if there's an email): `pnpm -s tool email send --to "<email>" --subject "<emailSubject>" --body "<emailBody>"`.
6. Log + advance: `pnpm -s tool db record --json '{"prospect_id":"<id>","ad_id":"<foreplay_id>","channel":"x","direction":"out","ref":"<tweetId>","text":"<xPost>"}'` then `pnpm -s tool db stage --id <id> --stage roasted`.

## Guardrails
- `paused: true` → publish nothing.
- Segment B (no active X) → omit `--handle`; email only.

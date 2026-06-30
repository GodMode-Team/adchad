---
name: probe-shared-dedup-all-claimers
description: New claim-channel on the shared `interactions` dedup table → every sibling claim-writer must widen its dedup SELECT, else cross-source double-action
metadata:
  type: feedback
---

When a new runner claims work via a `channel=<x>` marker on the shared `interactions` table (dedup-before-acting), every OTHER runner that claims the SAME underlying tweet/id must widen its dedup `SELECT` to `channel in (...)` to honor the new claim.

**Why:** A launch-thread image-reply auto-tags @adchad → the same id lands in BOTH the launch `conversation_id` sweep AND the mentions timeline. launch.run dedups on `channel='launch'`, mention.run on `channel='mention'` — keyed on the same id but different channels → the reply gets roasted twice (free comp + $5 sell, two public roasts, double vision+Grok cost). This was the spec-15 reopened BLOCKER. Fix widened BOTH SELECTs to `channel in ('launch','mention')` (mention.ts + launch.ts); ordering (engage runs launch before mention) decides the winner.

**How to apply:** On any diff that adds a new claim/dedup channel, grep EVERY runner that writes a claim for the same id space (`grep -n "channel in\|channel='" tools/*.ts`) and confirm each one's dedup predicate includes the new channel — both directions, with a regression test per direction. This is the WRITER-side mirror of [[probe-exclusion-tag-all-readers]] (which covers READERS of an exclusion tag). Rule-of-three watch: a 3rd channel will re-trip this — code-reviewer already flagged the run-skeleton duplication.

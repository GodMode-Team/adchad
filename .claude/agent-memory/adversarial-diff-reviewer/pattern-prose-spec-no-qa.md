---
name: pattern-prose-spec-no-qa
description: Recurring gap — skill SKILL.md + spec prose changes ship with a new "Validated when" criterion but zero manual-qa exercise of it
metadata:
  type: project
---

Specs here often have a "Validated when (Manual QA)" section (agent-behavior, e.g. spec-02 empty-scan broaden-once-then-stop). Prose changes to skills/*/SKILL.md add new criteria but the manual-qa-log typically covers only the UI/feed chunk, leaving the behavioral guardrail unverified.

**Why:** prose changes feel "done" once the wording matches the spec; the runtime-agent QA is expensive and gets deferred silently.

**How to apply:** when a diff touches skills/*/SKILL.md or a spec's Validated-when list, check manual-qa-log for an entry that actually drives that behavior. Prose-matches-spec ≠ validated. Missing QA on a behavioral guardrail (spiral/cost guard) = MAJOR unless the user explicitly defers. See [[pattern-qa-not-self-healed]].

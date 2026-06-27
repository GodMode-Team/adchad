---
name: pattern-qa-not-self-healed
description: Recurring gap — manual-qa MINORs get code-fixed but the promised self-healing regression test is never added
metadata:
  type: project
---

The pipeline's self-healing principle: every QA finding becomes a permanent test. Observed (spec-09): QA M1 (Stripe id leaking into money line) was fixed in code (tools/db.ts token strip) but the "money titles contain no cs_/pi_ token" test the QA note itself prescribed was never written.

**Why:** the code fix closes the visible symptom, so the follow-up test feels optional; code-reviewer marks it FIXED on the code change alone.

**How to apply:** for each QA finding that says "→ convert to a test", grep the test files for that assertion. Code-fixed-but-no-test = MINOR self-healing gap; log it every time so the backstop actually shrinks over time. See [[pattern-prose-spec-no-qa]].

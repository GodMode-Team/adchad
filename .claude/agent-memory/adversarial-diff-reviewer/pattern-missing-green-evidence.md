---
name: pattern-missing-green-evidence
description: Recurring gap — RED is quoted but GREEN runner output is never quoted; only a bare "Green" claim in code-reviewer-log
metadata:
  type: project
---

Pipeline step-3 requires runner output showing the new test names now PASS, quoted into a log. Observed (spec-09 chunk, 2026-06-26): test-engineer-log quoted RED only; no run-log.md existed; code-reviewer-log said the regression test was "Green" with no runner output.

**Why:** the new tests (tests/tools/db-feed.test.ts, tests/feed-route.test.ts) hit a live Neon DB, so nobody re-pastes the run, and a read-only reviewer cannot run them (mutating). See [[probe-live-db-readonly]].

**How to apply:** when only RED is quoted and GREEN is asserted in prose, mark it a MAJOR gap and demand the quoted FAIL→PASS. Do NOT run the live-DB tests yourself. Weigh down severity only if the implementation is correct-by-inspection AND manual-qa confirms behavior on the real artifact — but still require the artifact.

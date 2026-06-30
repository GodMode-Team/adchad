# adversarial-diff-reviewer memory — adchad

- [Green evidence skipped](pattern-missing-green-evidence.md) — code-reviewer writes bare "Green"; no quoted FAIL→PASS run-log. Recurs because tests hit live Neon DB.
- [Prose-spec criteria unvalidated](pattern-prose-spec-no-qa.md) — skill/SKILL.md + spec prose changes ship without any manual-qa exercise of the new behavior.
- [QA findings not promoted to tests](pattern-qa-not-self-healed.md) — QA MINORs get code-fixed but the self-healing regression test is skipped.
- [Live-DB read-only constraint](probe-live-db-readonly.md) — feed/db tests insert+delete on live Neon; reviewer cannot re-run them, must rely on quoted evidence.
- [Primitive built, no prod caller](pattern-primitive-no-caller.md) — new db op/tool unit-tested but never wired into the agent flow → feature empty in prod despite green tests. Grep callers across skills/tools/app.
- [Exclusion tag → check ALL readers](probe-exclusion-tag-all-readers.md) — new col/channel meant to hide rows from public surfaces: grep every reader of that table, not just the one the diff patched.
- [Shared dedup → check ALL claimers](probe-shared-dedup-all-claimers.md) — new claim-channel on shared `interactions`: every sibling runner's dedup SELECT must widen to `channel in (...)` or the same id gets double-actioned (spec-15 reopened BLOCKER).

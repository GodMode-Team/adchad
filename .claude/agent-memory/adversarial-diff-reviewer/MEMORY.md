# adversarial-diff-reviewer memory — adchad

- [Green evidence skipped](pattern-missing-green-evidence.md) — code-reviewer writes bare "Green"; no quoted FAIL→PASS run-log. Recurs because tests hit live Neon DB.
- [Prose-spec criteria unvalidated](pattern-prose-spec-no-qa.md) — skill/SKILL.md + spec prose changes ship without any manual-qa exercise of the new behavior.
- [QA findings not promoted to tests](pattern-qa-not-self-healed.md) — QA MINORs get code-fixed but the self-healing regression test is skipped.
- [Live-DB read-only constraint](probe-live-db-readonly.md) — feed/db tests insert+delete on live Neon; reviewer cannot re-run them, must rely on quoted evidence.

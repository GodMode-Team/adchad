---
name: pattern-primitive-no-caller
description: New db op / tool / primitive is built + unit-tested but never wired into the production caller, so the feature is empty in prod despite green tests
metadata:
  type: feedback
---

A new primitive (db op, tool, helper) ships with a passing unit test but has NO production caller, so the user-facing feature reads an empty source in production.

**Why:** Caught on spec-11 (2026-06-27). The `score` op + `vision` score field + page/feed score subqueries were all built and tested, but the agent's prospect→roast skill (skills/roast/SKILL.md) never calls `db score` — only the test and the web `intake` path write `scores`, and web intakes are excluded from the public feed. Net: the Live feed renders zero scores for real agent activity even though every test is green and `manual-qa` claimed "score chips." `git show main:tools/db.ts` confirmed nothing wrote scores before, so it wasn't pre-existing.

**How to apply:** When a diff adds a new `case '<op>'` / exported fn / primitive, grep the whole repo (skills/, tools/, app/) for its caller — `grep -rniE "db <op>|run\(['\"]<op>"`. If the only callers are tests + a narrow path, and a spec criterion says the feature appears on a surface fed by a DIFFERENT path, that surface is empty in prod = MAJOR. The read-side plumbing being present + tested is a decoy; the missing write-side caller is the gap. This is the cross-cutting "functions modified without grepping callers" check that [[pattern-missing-green-evidence]] upstream stages tend to skip. Pairs with [[pattern-qa-not-self-healed]] (QA asserts a UI element that can't actually populate).

**Effective fix shape (verified to close it, commit 732fcfd):** make the persistence DETERMINISTIC inside the primitive's natural caller (here: `roast()` itself writes the score when handed ids), wire the CLI dispatcher to pass the ids, and let the agent skill prose only SUPPLY the ids — not do the write. A tool that self-persists + a regression test on the tool closes the gap; relying on the agent SKILL.md to call a separate `db score` step would have stayed prose-dependent and unverifiable. When re-verifying such a fix: confirm the write lives in the tool (not just SKILL.md), the dispatcher passes the args, and a test asserts the row lands. Keying matters — write with BOTH ids so prospect-event AND roast-event read subqueries resolve.

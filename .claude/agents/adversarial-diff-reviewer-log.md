# adversarial-diff-reviewer log

## 2026-06-26T22:27:35Z, tasks spec-09-live + spec-02-prospect
VERDICT: GAPS FOUND

Diff target: uncommitted working tree (`git diff` + new untracked files app/api/feed/route.ts, app/live/page.tsx, tests/feed-route.test.ts, tests/tools/db-feed.test.ts, specs/spec-09-live.md). Project root: /Users/jeremylanger/jeremy/adchad. No project-level CLAUDE.md; global pipeline rules in ~/.claude/CLAUDE.md apply.

CHECKLIST COVERAGE — spec-09 (/live):
- [x] `feed` op, named op / no raw SQL, UNION prospects+interactions+ledger, normalized {ts,kind,icon,title,...} -> tools/db.ts:88-123
- [x] newest-first, limit 50 across sources -> tools/db.ts:120,122 (each source limit 50 -> merge -> sort desc -> slice(0,50); globally-correct newest-50)
- [x] joined to prospects for display names -> tools/db.ts:95 (left join), :104
- [x] stats block reuses metrics+ledger (prospects/roasts/sales/revenue/cost/margin) -> tools/db.ts:122; keys exist in metrics op (db.ts:8-18) + ledger op (db.ts:19-23)
- [x] icon/title mapping (target/roast/reply/email/fix/money) matches spec -> tools/db.ts:102-118
- [x] GET /api/feed -> JSON {events,stats}, force-dynamic, never cached -> app/api/feed/route.ts:4,11-15 (Cache-Control:no-store on success+error)
- [x] /live mobile-first dark page: header+LIVE dot+P&L counters, vertical timeline, 5s poller prepend, "warming up" empty state -> app/live/page.tsx:37,48-86,68
- [x] PRIVACY invariant enforced IN THE SQL PROJECTION (not only JS) -> tools/db.ts:93 `case when i.channel='x' and i.direction='out' then i.text else null end as text`; from_addr/subject/buyer_email never selected (buyer_email is orders-only, db/schema.sql:52; feed never queries orders)
- [x] regression test seeds an INBOUND email body and asserts absence -> tests/tools/db-feed.test.ts:22-23 (email/in PRIVATE_BODY), :70 assertion
- [ ] spec-09 failing-test #3 "/live renders >=1 event row + P&L counters (RED before)" -> GAP: no automated page test (tests/live.test.ts absent). Covered only by Manual QA snapshot (manual-qa-log.md:8). See MINOR-3.
- [ ] spec-09 failing-test #2 "non-cached headers" -> GAP: feed-route.test.ts:9-15 asserts 200+events+stats but NOT the no-store header. See MINOR-4.
- [ ] GREEN runner output for the new tests -> GAP: no quoted FAIL->PASS anywhere; only a bare "Green" claim (code-reviewer-log.md:73). See MAJOR-1.

CHECKLIST COVERAGE — spec-02 (prospect guard):
- [x] "Query = bare niche, never geography" prose -> skills/prospect/SKILL.md:2 + specs/spec-02-prospect.md:8 (matches verbatim)
- [x] "Empty-result guard: broaden once -> else record note + STOP" prose -> skills/prospect/SKILL.md:2 + specs/spec-02-prospect.md:9 (matches)
- [ ] spec-02 Validated-when #4 (broaden-once-then-stop, no spiral) -> GAP: zero verification — prose-only change, no test, and manual-qa-log.md covers spec-09 ONLY. See MAJOR-2.

ADVERSARIAL FINDINGS:
1. No quoted GREEN runner output for the named tests (severity: major)
   evidence: test-engineer-log.md:18-40 quotes RED only ("RED only ... No implementation"); ls .claude/agents/ shows no run-log.md; code-reviewer-log.md:73 asserts the MINOR-3 regression test is "Green" but quotes no runner output. db-feed/feed-route tests hit a LIVE Neon DB (insert/delete), so as a read-only gate I cannot run them to confirm.
   required: pipeline step-3 evidence — runner output showing tests/tools/db-feed.test.ts (5 tests) + tests/feed-route.test.ts now PASS, by name, quoted into the test-engineer/run log. RED is sound and explicit; only GREEN is missing.
   note: implementation is correct by inspection (the SQL `case` at db.ts:93 forces text=null for any non-x/out row), and Manual QA confirmed end-to-end behavior on the live server — so risk is LOW, but the contract artifact is absent and the orchestrator explicitly asked me to confirm GREEN.

2. spec-02 Validated-when #4 has no verification evidence (severity: major)
   evidence: specs/spec-02-prospect.md:17 adds acceptance criterion #4 in THIS diff; it is a "Validated when (Manual QA)" item. manual-qa-log.md exercises only the /live feed — no entry drives the prospect skill against a no-ads niche.
   required: a manual-qa entry running the skill against an empty-scan niche, citing that it broadened once, recorded the `note`, and STOPPED — or an explicit user WONTFIX/defer-to-live-demo. The guard prevents a runaway debug spiral / cost, so it is behavioral, not cosmetic.

3. spec-09 failing-test #3 (/live page render) has no automated test (severity: minor)
   evidence: tests/ contains only feed-route.test.ts + tools/db-feed.test.ts; no tests/live.test.ts. The spec lists the page render as a required failing test.
   required: either an RTL/jsdom render test asserting >=1 event row + counters, or an explicit decision to cover via Manual QA (which was done: manual-qa-log.md:8, snapshot uids + screenshot). Behavioral criterion is met; the spec-prescribed test form is missing.

4. Route test does not assert the non-cached header (severity: minor)
   evidence: feed-route.test.ts:9-15 asserts status/events/stats only; spec-09:22 requires "non-cached headers"; route sets Cache-Control:no-store (route.ts:15,18) but no test pins it.
   required: assert res.headers Cache-Control includes no-store (cheap regression lock against a future caching change).

5. QA M1 fixed in code but not converted to a self-healing test (severity: minor)
   evidence: manual-qa-log.md:12 says "-> convert to a self-healing test (money titles contain no cs_/pi_ token)"; code-reviewer-log.md:79 marks QA M1 FIXED (token strip at db.ts:117) but adds no test; db-feed.test.ts has no money-token assertion.
   required: per the pipeline self-healing principle, a permanent test asserting money event titles contain no >20-char ID-like token (e.g. cs_test_*/pi_*).

6. PII test's column-name assertions are near-vacuous (severity: nit, not a defect)
   evidence: db-feed.test.ts:71-73 assert absence of 'from_addr'/'subject'/'buyer_email' strings — these can never appear (orders is never queried; those columns are never selected/aliased). The real teeth are the PRIVATE_EMAIL (:69) and PRIVATE_BODY (:70) checks, which ARE sound and cover the inbound-body leak.
   required: none — noting so the team doesn't mistake the string checks for the load-bearing assertions.

UPSTREAM STAGE VERIFICATION:
- test-engineer: RED explicit + quoted (test-engineer-log.md:18-40: `unknown op 'feed'` x5 + `Cannot find module '../app/api/feed/route'`). Non-vacuous tests confirmed by reading (ordering, margin_cents numeric, roast-text presence, PRIVATE_EMAIL/PRIVATE_BODY absence). GREEN NOT quoted -> MAJOR-1.
- code-reviewer: 1 MAJOR + 4 MINOR + NITs. ALL claimed code resolutions verified PRESENT in the diff: MAJOR-1 micro-cache (route.ts:8-15), MINOR-2 https-only image guard (db.ts:112), MINOR-3 SQL-layer PII case + inbound regression test (db.ts:93 / db-feed.test.ts:22-23,70), MINOR-4 no revenue_cents collision (db.ts:121-122, revenue_cents from metrics), NIT error-echo -> generic body + server log (route.ts:17-18), NIT prospects.id dropped (db.ts:90), QA M1 token strip (db.ts:117). No claimed-but-absent CODE fixes. Gap is the QA M1 self-healing TEST (MINOR-5), not a false claim.
- slop-detector: log absent (not run / not provided). Not required by the chunk; no dead-code concerns found on inspection.
- security-review: no standalone security-review-log.md; security folded into code-reviewer-log.md (security-weighted). PII/SQLi/XSS/SSRF all PASS with cited reasoning (code-reviewer-log.md:11-16). Acceptable for this chunk.
- manual-qa: spec-09 covered with citations — endpoint shape (37 events, margin_cents), live PII grep = 0 matches, client render counters, mobile screenshot pipeline-runs/screenshots/2026-06-26-live/live-mobile-390.png. spec-02 NOT covered -> MAJOR-2.

RECOMMENDATION: do not check off. Two majors gate it: (MAJOR-1) quote the GREEN FAIL->PASS runner output for both new test files into the run/test-engineer log; (MAJOR-2) add a manual-qa entry exercising spec-02's empty-scan broaden-once-then-stop guard, or get an explicit user defer/WONTFIX. Route MAJOR-2 back to step 6 (manual-qa) and MAJOR-1 back to step 3 (quote the green run). Minors 3-5 stay logged and can be addressed in the same pass. Implementation itself is sound by inspection — the gaps are missing verification artifacts, not broken code.

---

## 2026-06-26T22:41Z, tasks spec-09-live + spec-02-prospect — RE-VERIFY after rework
VERDICT: PASS

Re-checked the coordinator's claims against artifacts (coordinator carries no authority; the artifacts do). Tracked diff is byte-identical to the prior review (tools/db.ts unchanged at 38 insertions — implementation not silently altered). Ran `npx tsc --noEmit` myself (read-only): exit 0, only the benign `verify-deps-before-run` npm warn. Did NOT run the live-DB vitest suite (mutates Neon) — relied on the now-quoted GREEN run-log, as the project's live-DB constraint requires.

PRIOR FINDINGS — DISPOSITION:
- MAJOR-1 (no quoted GREEN) -> CLOSED. run-log.md:5-19 now quotes RED (5 FAIL: `unknown op 'feed'` + `Cannot find module '../app/api/feed/route'`) AND GREEN (`Test Files 2 passed (2); Tests 7 passed (7)`, 2026-06-26 16:30). Test count is coherent with the files I read: db-feed.test.ts has 6 `it` blocks, feed-route.test.ts has 1 = 7. Full suite quoted 16 passed / 3 skipped (Stripe-gated); tsc exit 0 — independently re-confirmed by me.
- MAJOR-2 (spec-02 #4 unvalidated) -> CLOSED. manual-qa-log.md:19-26 drives the REAL agent on a dead-end niche, cites the literal final answer ("No ads found for 'zxqvwklmn nonexistent niche' or 'zxqvwklmn'. No target to roast…"), proving broaden-once -> bare term -> still empty -> report + STOP, no spiral (wall 3m40s / CPU 12.9s; max_turns=50 backstop). Cited literal output meets the evidence bar.
- MINOR-4 (no-store header untested) -> CLOSED. feed-route.test.ts:15 asserts `res.headers.get('Cache-Control')` contains 'no-store'.
- MINOR-5 (QA M1 self-heal test absent) -> CLOSED. db-feed.test.ts:78-81 seeds a `cs_test_…` ledger note (:26) and asserts the payload contains no `cs_test_`; non-vacuous (strip logic at tools/db.ts:117 drops the >20-char token). afterAll cleanup widened to `note like %uniq%` (:31) — both seeded ledger rows are removed.
- MINOR-3 (/live page render not unit-tested) -> ACCEPTED, stays logged. QA-covered via screenshot (manual-qa-log.md:9, live-mobile-390.png) + page snapshot uids, consistent with the /report and /work server-component precedent. Behavioral criterion met; not a blocker.
- NIT-6 (vacuous from_addr/subject/buyer_email string checks) -> unchanged, non-defect; the load-bearing PRIVATE_EMAIL + PRIVATE_BODY assertions remain sound.

NEW (housekeeping, not a code defect):
- Stray untracked archives `AdChad PRD.zip` and `AdChad PRD (1).zip` sit in the tree. Not part of this chunk — ensure `/commit` does not stage them (severity: nit).

UPSTREAM STAGE VERIFICATION (delta):
- test-engineer / run-log: RED + GREEN both quoted; FAIL→PASS complete for both new test files. PASS.
- manual-qa: spec-09 (prior) + spec-02 #4 (new) both cited with literal evidence. PASS.
- code-reviewer: all claimed code resolutions remained verified-present (diff unchanged). PASS.

RECOMMENDATION: check off both tasks and proceed to commit. All blockers/majors and the two blocking minors are closed with real, cited artifacts; the one remaining minor is an accepted QA-coverage decision. Before `/commit`, confirm the two stray PRD `.zip` files are not staged.

# adversarial-diff-reviewer log

## 2026-06-26T22:27:35Z, tasks spec-09-live + spec-02-prospect
VERDICT: GAPS FOUND

Diff target: uncommitted working tree (`git diff` + new untracked files app/api/feed/route.ts, app/live/page.tsx, tests/feed-route.test.ts, tests/tools/db-feed.test.ts, specs/spec-09-live.md). Project root: ~/adchad. No project-level CLAUDE.md; global pipeline rules in ~/.claude/CLAUDE.md apply.

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

---

## 2026-06-27T03:37:12Z, tasks spec-10-design + spec-11-ondemand (brand redesign + creative score + on-demand roast)
VERDICT: GAPS FOUND

Diff target: `git diff main...HEAD` on branch `redesign` (6 commits 5be1882→67d176c). Project root: ~/adchad. No project-level CLAUDE.md; global pipeline rules in ~/.claude/CLAUDE.md apply. Independently ran `npx tsc --noEmit` (read-only): exit 0 (only the benign `verify-deps-before-run` npm warn). Did NOT run the live-DB vitest suite (it inserts/deletes on live Neon) — relied on quoted evidence per the project's live-DB constraint.

CHECKLIST COVERAGE — spec-10 (redesign):
- [x] Fonts via next/font/google (Anton, Archivo_Black, Bungee, Permanent_Marker, Space_Mono, DM_Sans) → CSS vars -> app/layout.tsx:2,6-11,19; aliased in app/globals.css:14-19 (DM Sans = body, globals.css:24)
- [x] Palette bg/green/pink/yellow/ink + brutalist primitives + keyframes (mq/blink/wobble/throb) -> app/globals.css:3-7,29-39
- [x] Assets chad-cutout.png + chad-logo.png → public/ -> diffstat (both Bin added)
- [x] Home: ticker -> page.tsx:42-47; sticky nav -> :50-60; green hero + ROAST-ME box -> :62-81 (+ RoastBox.tsx); EXHIBIT-A -> :83-117; FOUR STEPS/ZERO HUMANS -> :119-139; pricing $0/$5/$12/$49 -> :148-183; WATCH ME RUN THE BUSINESS w/ REAL counters -> :17-23,200-205 (run('metrics')/run('ledger')); final CTA -> :210-218; footer CAN-SPAM addr + @adchadofficial -> :237,244
- [x] Funnel: phone-framed (maxWidth 440), real db page data -> p/[id]/page.tsx:17,62 + Funnel.tsx:35,49; roast screen creative_url+roast+score -> Funnel.tsx:43-44,62-147; paywall before→after + chips + $12 order-bump -> :151-230; CTA → /api/checkout anchor -> :223,47; ?paid=1 → done screen -> :37,233-282
- [x] Live: P&L tiles + SCANNED/ROASTS/SALES + timeline + NEW badge + Chad mascot + real /api/feed -> live/page.tsx:76-121,134-176,62
- [x] No fake DCLogic anywhere — counters/score/roast all from run() ops -> page.tsx:14-15, Funnel via db page, live via /api/feed
- [ ] spec-10 Live "render the real score on target/roast/fix events" -> GAP: the read plumbing exists (feed score subqueries db.ts:110,116) but NOTHING populates `scores` for agent activity, and web-intake rows (the only scored ones) are excluded from the feed -> NO event can ever carry a score in production. See MAJOR-1.

CHECKLIST COVERAGE — spec-11 (score + on-demand roast):
- [x] vision.describe() emits integer score 0–100 + verdict, clamped, real_flaws preserved -> tools/vision.ts:43-44,53-57,72-77
- [x] `score` op persists to existing scores table -> tools/db.ts:70-73
- [x] db page includes score (Funnel) -> tools/db.ts:38-39; db feed includes score (Live) -> tools/db.ts:110,116,124,128
- [x] POST /api/roast: content-length pre-check (413) -> route.ts:21-22; durable daily cap before spend -> :24-25; mime/email/size guards -> :30-35; Blob upload -> :38-40; vision ONCE + reused look -> :43-44 (+ roast.ts:45-46); persist ad+prospect+PRIVATE roast(channel='roast')+score -> :47-49 (intake op db.ts:74-82); returns {prospectId,score,verdict,roast,originalUrl} -> :53
- [x] Rate-limit per-IP + per-email -> route.ts:30-32 (hit()); kill-switch note: email REMOVED so paused-gate is moot (MAJOR-1 resolution)
- [x] /p/<id> surfaces the web roast (channel in ('x','roast')) -> db.ts:34; db-intake.test.ts:20-27 asserts it
- [ ] spec-11 "the agent's /prospect→/roast path scores too — so every roast carries a number" -> GAP: the agent roast skill (skills/roast/SKILL.md:39) only does `db record` + `db stage`; it never calls `db score`. No agent skill writes scores. See MAJOR-1.
- [ ] spec-11 failing-test #2: `POST /api/roast` route test (shape + persists rows + 2nd-over-limit → 429) -> GAP: no automated test drives the route; pieces covered (op test + hit() unit + one QA happy-path), but the route's 429-over-limit path is never exercised end-to-end. See MINOR-1.
- [ ] Quoted RED→GREEN runner output for the spec-11 test files -> GAP: RED quoted for score/db-score only; NO RED for db-intake/ratelimit; NO GREEN transcript anywhere (only a bare "12 tests green"). See MAJOR-2.

ADVERSARIAL FINDINGS:
1. The creative score is never persisted on the agent's prospect→roast path — so the public Live feed renders ZERO scores in production (severity: MAJOR)
   evidence: `grep -rniE 'db .*score|run.*score'` over skills/ → no hits; scores is INSERTed only by the new `score` op (tools/db.ts:71, called only by tests/tools/db-score.test.ts) and the `intake` op (tools/db.ts:80, called only by the web route). `git show main:tools/db.ts` had no scores writer either. The roast skill's publish step (skills/roast/SKILL.md:39) records the interaction + advances stage but never scores. Consequence: the feed score subqueries (db.ts:110 prospect_id, db.ts:116 ad_id) read an empty table for every agent prospect/ad → score=null → no chip. The ONLY scored rows are web intakes, which the feed explicitly excludes (db.ts:111, channel='roast' falls through all emit branches db.ts:127-134). Net: spec-11 "every roast carries a number" is false for the agent flow, and spec-10 Live "render the real score on target/roast/fix events" is structurally empty for all real autonomous activity.
   required: wire the agent prospect→roast path to persist the score — e.g. the roast skill (or the publish step) calls `db score --ad_id <id> --prospect_id <id> --total <look.score>` using the score `vision.describe()` now returns, so agent roasts carry a number and the Live/Funnel score surfaces on real events. Then a test/QA that a feed roast event from the AGENT path (channel='x') carries a numeric score (db-score.test.ts already proves the read side for a seeded x/out roast; the missing half is the production writer).
   note: this is the "built the primitive, forgot the caller" gap — `code-reviewer`'s "functions modified without grepping callers" cross-cutting check should have flagged that the new `score` op has no production caller; `manual-qa`'s "Live … + score chips" (manual-qa-log.md:47) is uncited and not reproducible in steady state.

2. No quoted RED→GREEN runner evidence for the spec-11/redesign chunk (severity: MAJOR)
   evidence: test-engineer-log.md:16-39 quotes RED ONLY for score.test.ts + db-score.test.ts. db-intake.test.ts and ratelimit.test.ts (both new, both testing new behavior — the `intake` op and the `hit` limiter) have NO quoted RED anywhere. run-log.md contains only Chunk A (/live prospect) + Chunk B (/live feed) — there is NO run-log section for this chunk, so NO GREEN transcript exists for any of the four spec-11 test files. The sole GREEN statement is code-reviewer-log.md:128 "tsc=0, 12 tests green" — a bare assertion with no test names and no FAIL→PASS lines. Per the pipeline contract (step 2 = quoted FAIL, step 3 = quoted PASS) and prior precedent (the first entry in this log treated the identical gap as MAJOR and required quoting before check-off), this is "not done." I independently confirmed `tsc`=0; I cannot run the live-DB suite.
   required: quote, into run-log.md (or test-engineer-log.md), the RED (FAIL) for db-intake.test.ts (`unknown op 'intake'`) and ratelimit.test.ts (`Cannot find module '../lib/ratelimit'`), and the GREEN run naming all four spec-11 test files now PASS. Implementation is correct by inspection + tsc clean + QA happy-path green, so risk is LOW — the artifact is what's missing.

3. spec-11 failing-test #2 (`POST /api/roast` route test, incl. 2nd-over-limit → 429) is not automated (severity: MINOR)
   evidence: no test imports/drives app/api/roast/route.ts. The shape is QA-verified once (manual-qa-log.md:34, score 65), persistence is op-tested (db-intake.test.ts), the limiter primitive is unit-tested (ratelimit.test.ts), and the route wires it correctly by inspection (route.ts:30-32 → 429). But the actual over-limit POST returning 429 is never exercised — manual-qa-log.md:38 explicitly punts it to the unit test.
   required: either an automated route test (mock-free is hard since it spends money; a thin test that stubs nothing but the model calls, or asserts the 429 branch via a pre-saturated limiter), or a Manual QA entry driving a real 2nd-over-limit call and citing the 429.

4. BLOCKER-1 residual — financial-DoS hardening (CAPTCHA / email-verification) deferred to operator (severity: MINOR, accepted)
   evidence: code-reviewer-log.md:120 flags it; route.ts caps spend via the durable `roastquota` daily cap (DAILY_CAP=40, checked at :24-25 BEFORE any spend) + per-email(3)/per-IP(12) throttle on a trusted `x-real-ip` (:30-32). Worst case ≈40 paid roasts/day. Verified present and correctly ordered.
   required: none to ship the demo — stays logged as a known production-hardening item for the operator.

UPSTREAM STAGE VERIFICATION:
- test-engineer: RED quoted for score.test.ts + db-score.test.ts ONLY (test-engineer-log.md:16-39); NO RED for db-intake/ratelimit; NO GREEN transcript for this chunk -> MAJOR-2. Tests themselves read as non-vacuous and live (score 0–100 on a real Foreplay ad; intake→page surfacing; hit() window).
- code-reviewer: 1 BLOCKER + 4 MAJOR + 7 MINOR. ALL claimed CODE resolutions verified PRESENT: BLOCKER-1 durable cap before spend + trusted x-real-ip (route.ts:24-25,30-32); MAJOR-1 auto-email REMOVED (no email import/call in route.ts; comment :51-52); MAJOR-2 single vision via reused look (route.ts:43-44 + roast.ts:45-46); MAJOR-3 content-length 413 before formData + cap 4MB (route.ts:12,21-22); MAJOR-4 intake stage='web' + metrics excludes inbound (db.ts:9-10,78); MINOR-1 SVG rejected (route.ts:14); MINOR-7 stripe success_url→/p/<id>?paid=1 (stripe.ts:24-25). No claimed-but-absent code fixes. MISS: did not flag that the new `score` op has zero production caller -> MAJOR-1.
- slop-detector: log absent (not run). No dead-code concern beyond the unreferenced `score` op surfaced in MAJOR-1.
- security-review: no standalone security-review-log.md; folded into code-reviewer-log.md (security-weighted). XSS/SQLi/SSRF/price-tamper all PASS with cited reasoning (code-reviewer-log.md:110-117); the unauth paid-endpoint risk is bounded (BLOCKER-1 residual, MINOR-4). Acceptable.
- manual-qa: spec-10 pages PASS w/ screenshots (home-desktop/funnel-mobile/live-mobile, manual-qa-log.md:45-48, tsc=0, 0 console errors); spec-11 endpoint happy-path PASS (score 65, real roast, no email, /p 200, persistence). GAPS: "Live … score chips" (:47) uncited and not reproducible given MAJOR-1; over-limit 429 punted to unit test (:38) -> MINOR-1. The inbound-feed-leak fix is verified (manual-qa-log.md:48, 0 leaked) and confirmed by me in code (db.ts:111,127-134) — privacy invariant HOLDS.

PRIVACY INVARIANT (orchestrator's explicit concern) — HOLDS: inbound web uploaders never surface in the public feed/counters. Prospect rows excluded at db.ts:111 (`email_source <> 'inbound'`); the web roast interaction (channel='roast', direction='out') falls through all four emit branches (db.ts:127-134) so its name/text/score never surface; metrics excludes inbound from prospects/roasted (db.ts:9-10) so Home + Live counters reflect agent activity only. Verified independently in code, not by claim.

RECOMMENDATION: do not check off. Two majors gate it. MAJOR-1 (route to step 3 — implementation): wire the agent prospect→roast path to persist the score so spec-11's "every roast carries a number" and spec-10 Live's score-on-events are real, not empty; add a test/QA that an AGENT-path (channel='x') feed roast event carries a numeric score. MAJOR-2 (route to step 2/3 — evidence): quote the RED for db-intake + ratelimit and the GREEN run naming all four spec-11 test files PASS. Minors 1,3-4 stay logged; MINOR-1 ideally addressed in the same pass. The redesign UI, the on-demand roast path, the security resolutions, and the privacy invariant are all sound and verified — the blocking gap is that the score feature is half-wired (read side built + tested, agent write side missing), which leaves the headline "score threaded through the pipeline" untrue for the autonomous flow that drives the public surfaces.

---

## 2026-06-26T (re-verify after rework — commit 732fcfd), tasks spec-10-design + spec-11-ondemand
VERDICT: PASS

Re-verified the coordinator's "both MAJORs closed" claim against artifacts only (the coordinator carries no authority; its relayed numbers were also checked against the artifact — see NIT). Diff target `git diff main...HEAD` now includes fix commit 732fcfd "agent roast path persists the creative score (adversarial MAJOR-1)". Re-ran `npx tsc --noEmit` myself: exit 0.

PRIOR MAJORS — DISPOSITION:
- MAJOR-1 (score never persisted on the agent path) -> CLOSED. The `score` op now has a real, DETERMINISTIC production caller: `tools/roast.ts` (732fcfd) — after Grok writes the roast, `if (opts.adId && opts.prospectId) { run('score', { ad_id, prospect_id, total: look.score }) }`, keyed on BOTH ids so the feed prospect-event subquery (db.ts:110, prospect_id) AND the roast-event subquery (db.ts:116, ad_id) both match. Wired end-to-end: dispatcher passes `--ad-id`/`--prospect-id` (scripts/tool.ts:56); `roast()` returns `{score, verdict}` (Roast type extended). The agent is told to pass the ids when roasting a /prospect target (skills/roast/SKILL.md step 2) — prose, but the SAME class as every other agent-skill instruction here (e.g. the publish step's `db record`); the load-bearing persistence lives in the tool, not the prose. Write side proven by new regression `tests/tools/roast-score.test.ts` (precomputed look score=42 + ids → a `scores` row total=42 lands); read side already proven by `db-score.test.ts` test C (a channel='x' roast feed event carries the number). The halves compose to satisfy spec-11 "every roast carries a number" + spec-10 Live "score on target/roast/fix events." Verified in the committed diff, not by claim.
- MAJOR-2 (no quoted RED→GREEN for the spec-11 chunk) -> CLOSED. run-log.md:30-48 now quotes RED for ALL four files — including the two previously missing: db-intake (`db: unknown op 'intake'`) and ratelimit (`Cannot find module '../lib/ratelimit'`) — AND GREEN: score+db-score 4 passed; ratelimit+db-intake 3 passed; roast-score 1 passed; full suite Test Files 12 passed / Tests 33 passed | 3 skipped; tsc=0. I corroborated the counts against the static structure: `find tests -name '*.test.ts'` = 13 files; summing `it/test` blocks in the 12 non-gated files = exactly 33; `gated.test.ts` holds exactly 3 `it.skipIf` Stripe/live tests = the 3 skips + the 13th file is "skipped", not "passed". The artifact's "12 passed / 33 passed | 3 skipped" is internally coherent and matches reality. tsc=0 re-confirmed by me.

REMAINING (non-gating, logged):
- MINOR-1 (no automated `POST /api/roast` route test incl. 2nd-over-limit → 429) -> STILL OPEN, non-gating. roast-score.test.ts exercises `roast()`, not the route handler; the route's 429 path stays unit-tested (`hit()`) + correct-by-inspection (route.ts:30-32). Recommend a thin route test or a QA over-limit citation when convenient.
- BLOCKER-1 CAPTCHA/email-verification residual -> accepted, logged; spend bounded ~40/day by the durable `roastquota` cap.
- NIT (relay vs artifact): the coordinator's message said "Test Files 13 passed; Tests 34 passed | 3 skipped" but the run-log artifact says "12 passed; 33 passed | 3 skipped." The ARTIFACT is correct (the 13th file is the fully-skipped gated suite, not "passed"; 33 = the exact non-gated it-count). Harmless paraphrase drift; the authoritative artifact is right. Flagging only because I gate on artifacts, not relays.

UPSTREAM STAGE VERIFICATION (delta):
- test-engineer / run-log: RED + GREEN now quoted for all four spec-11 files + the roast-score regression. FAIL→PASS complete. PASS.
- code-reviewer: prior MAJOR-1 miss (new `score` op had no production caller) is resolved upstream by 732fcfd; all earlier code resolutions remain verified-present. PASS.
- manual-qa: spec-10 pages + spec-11 happy-path cited; privacy invariant re-confirmed by me in code (db.ts:111,127-134); the earlier uncited "score chips" claim is now backed by a real write path (roast-score test). PASS.

RECOMMENDATION: check off both spec-10-design and spec-11-ondemand and proceed to step 8 (commit). Both blocking majors are closed with deterministic code + a quoted, independently-corroborated RED→GREEN run; the privacy invariant and security resolutions hold; the one open item (MINOR-1, route-level 429 test) is non-gating and stays logged. Fix commit 732fcfd is already committed; the agent logs are the only uncommitted changes.

---

## 2026-06-30T05:03:14Z, task spec-14-launch
VERDICT: PASS

Diff target: uncommitted working tree (`git diff HEAD` on tools/db.ts, tools/xread.ts, scripts/tool.ts, db/schema.sql, skills/engage/SKILL.md, specs/spec-14-launch.md) + new untracked tools/launch.ts, tests/tools/launch.test.ts. Contract: specs/spec-14-launch.md. Project root: ~/adchad; global pipeline rules in ~/.claude/CLAUDE.md apply (no project CLAUDE.md). Did NOT run the live-DB vitest suite (launch.test.ts inserts/deletes on live Neon) — relied on the quoted RED→GREEN per the project's live-DB constraint; verified implementation correctness by reading the diff + every reader of the orders/interactions tables.

CHECKLIST COVERAGE — Validated-when:
- [x] #1 image reply → public roast → free-fix reply within the beat -> roast: tools/launch.ts:58 (d.roast→xroast public reply, tools/xroast.ts:57,60); free fix: tools/launch.ts:60-61 comped order drained by the single worker (tools/fulfill.ts:89-92 select matches tier=5/paid/livemode, fulfillOrder posts X reply tools/fulfill.ts:61-68). Image-only filter is server-side `has:images` (tools/xread.ts:42). NOTE: the fix lands via the 30s fulfill-worker, not inline (code-review fix #1) — within the 15m beat window, not the same invocation; this is the deliberate no-double-post design (spec line 15 endorses worker-drain). Live e2e is gated/UNVERIFIED (see residual R1).
- [x] #2 text-only skipped (no image) -> server-side `has:images` (tools/xread.ts:42) — text-only never returned; own fix-reply skipped -> self-guard tools/launch.ts:49 (case-insensitive, tools/launch.ts:43); tested tests/tools/launch.test.ts:79-89
- [x] #3 same reply next beat not reprocessed (dedup) -> tools/launch.ts:52-53 (select marker → skip 'dup'); tested tests/tools/launch.test.ts:91-103
- [x] #4 ledger revenue=0, real gen cost -> no revenue ever booked for the comped order; metrics excludes source='launch' (tools/db.ts:36-37); cost booked by fulfillOrder→bookCost (tools/fulfill.ts:56); tested tests/tools/launch.test.ts:112-123 (metrics-exclusion). Kill-switch paused → nothing posts -> tools/launch.ts:41 + belt/suspenders tools/xroast.ts:27-28; tested tests/tools/launch.test.ts:134-140

CHECKLIST COVERAGE — Deliverable + guards:
- [x] Launch tweet id on control row (no new table) -> db/schema.sql:123; arm/disarm round-trip tools/launch.ts:71-82 (tweetIdOf sanitizes to digits, tools/xroast.ts:17-19); tested tests/tools/launch.test.ts:143-156
- [x] `xread --replies` mode: conversation_id + has:images + media/author expansions, needs paid X tier -> tools/xread.ts:36-51; CLI dispatch scripts/tool.ts:43-46; "paid tier" documented tools/xread.ts:33 + SKILL.md:18
- [x] Dedup on reply id -> tools/launch.ts:52 (keyed on incoming reply.id)
- [x] Roast everything-with-image, NO "is it an ad" gate, two guards only (no-image + own-handle) -> no gate in run(); no-image via has:images server filter; own-handle tools/launch.ts:49
- [x] xroast --tweet replyId -> tools/launch.ts:23,58
- [x] Free fix: comp tier=5/status='paid'/amount=0/source='launch', worker drains (no inline fulfill) -> tools/launch.ts:60-61; worker query has NO source filter so it WILL drain it (tools/fulfill.ts:90); fulfillOrder books cost only, never revenue (tools/fulfill.ts:56). source excluded from public sales count -> tools/db.ts:36-37. dedup marker internal channel='launch', off /live -> tools/db.ts:9
- [x] Runner `launch run` + arm/disarm via CLI -> scripts/tool.ts:47-52; invoked each engage beat -> skills/engage/SKILL.md:18 (step 0); `launch` added to tool list scripts/tool.ts:86-87
- [x] Kill-switch only, no cap -> tools/launch.ts:41; no cap logic present anywhere in run()

ADVERSARIAL FINDINGS (all minor — none gate):
1. Claim-first dedup is check-then-insert, not atomic (severity: minor)
   evidence: tools/launch.ts:52 (`select 1 …`) then :54 (`insert … 'launch'`); db/schema.sql has NO unique index on interactions(channel,ref) (grep for unique/index on interactions → none). Two concurrent run() invocations could both read "no marker", both insert, both roast → double public roast.
   required: none to ship — the deployment model is a single engage cron beat (sequential, no overlap), and claim-first fully meets its stated purpose (crash/restart between roast and order can't double-post, tools/launch.ts:50-51). To make it bulletproof against any future concurrent runner, add `create unique index on interactions(channel, ref) where channel='launch'` so the duplicate insert throws instead of racing. Logged, non-gating.
2. Most-recent-100 image-replies/beat ceiling vs the spec's "flood" goal (severity: minor, already WONTFIX upstream)
   evidence: tools/launch.ts:44 calls d.replies(launchTweetId) with NO sinceId → tools/xread.ts:38 fetches max_results:100, no pagination/cursor. Spec line 3 goal is "a flood of replies"; >100 image replies between 15m beats drops the oldest beyond 100. code-reviewer-log.md:150 finding #10 = WONTFIX ("low realistic volume for a first launch").
   required: none now — NEWEST 100 are always processed and dedup keeps them idempotent across beats, so only the oldest in a >100/beat surge are skipped. Surfacing because the spec's headline is a flood; add a since_id cursor + pagination if volume warrants. Not re-litigating the WONTFIX.
3. The two code-review-driven regression tests have no separately-quoted isolated RED (severity: minor, process-evidence)
   evidence: run-log.md:62-63 RED snapshot is 8 tests (6 fail/1 pass/1 skip) — predates fixes #2/#4; the metrics-exclusion test (tests/tools/launch.test.ts:112-123) and the interactionEvent launch-guard test (:107-110) were added WITH the code-review fixes (code-reviewer-log.md:142,144), final GREEN = 10 passed. Their individual FAIL→PASS isn't quoted.
   required: none — both are verifiable by construction (remove tools/db.ts:9 guard → :109 fails; remove the tools/db.ts:36-37 source filter → :121-122 fails), and this is exactly the self-healing-test pattern. Logged.
4. channel='launch' markers occupy slots in the feed op's 50-row interaction window before interactionEvent drops them (severity: nit)
   evidence: tools/db.ts feed op selects `from interactions … limit 50` with no channel filter; the launch markers (direction='in') are fetched, then dropped by interactionEvent (tools/db.ts:9). Many markers could crowd real events out of the 50-row pre-filter window, thinning the public feed.
   required: none — pre-existing behavior (channel='note'/out internal rows already do this); text is NULL'd at SQL for non-x/out rows so nothing leaks. Cosmetic dilution only. Logged.

LEAK SWEEP (orchestrator's explicit concern) — comped order + launch marker stay off public surfaces:
- source='launch' order: the ONLY public sales/revenue counters are metrics.orders_paid + metrics.revenue_cents — BOTH excluded (tools/db.ts:36-37, tested :112-123). ledger op reads kind='revenue' rows (tools/db.ts:41) — launch books only cost, so revenue stays $0 (Validated-when #4). `db orders` (worker heartbeat, tools/db.ts:115) intentionally returns it for fulfillment. Halls-Fame/Shame + gallery (tools/db.ts:80-145) WILL showcase the launch prospect's genuinely-public roast+fix — this is consistent with the public-engagement design (NOT a sales count); flagged observationally so the operator knows launch fixes appear in the Halls (likely desirable). No revenue/sales leak.
- channel='launch' marker: interactionEvent returns null (tools/db.ts:9, /live feed). Every other interactions reader filters by channel and excludes 'launch': page/gallery `in ('x','roast')` (db.ts:55,129), fixstatus/halls-fame `'fix'` (db.ts:63,94), halls-shame `'x'` (db.ts:82), roastquota `'roast'` (db.ts:157), email.read `'email'` (tools/email.ts:21), fulfill `'x'`/`in ('roast','x')` (tools/fulfill.ts:36,48). No public leak.
- comped-order shape vs worker: tier=5/status='paid'/amount=0/livemode=true/source='launch' (tools/launch.ts:60-61) matches fulfillPaidOrders select (tools/fulfill.ts:90) AND fulfillOrder gate (tools/fulfill.ts:27-28). xroast pre-creates the prospect+ad+roast-tweet (tools/xroast.ts:50-51,60) so the order FK holds and delivery goes via X reply (no buyer_email needed, tools/fulfill.ts:38). Correctly shaped — the worker WILL drain it.
- test cleanup: every describe with DB writes cleans up (afterAll deletes by pid/replyId at tests/tools/launch.test.ts:39-46, :77, inline :119-120; arm/disarm restores the shared control row :146). No orphan rows on a clean run.

UPSTREAM STAGE VERIFICATION:
- test-engineer / run-log: RED quoted (run-log.md:55-64, 6 FAIL incl. `column "launch_tweet_id" does not exist` + "not implemented" run cases + mapReplies drop) → GREEN quoted (run-log.md:67-72: `Tests 8 passed`, tsc=0, dispatch/xpost-reply 12 passed no-regression). Final file = 10 tests after the 2 review-driven regression tests (code-reviewer-log.md:153 "10 passed") — count coherent with the file I read (2+1+2+2+2+1). RED→GREEN real for the core feature; the 2 regression tests' isolated RED is the only minor gap (finding #3).
- code-reviewer: 11 findings — 2 BLOCKER + 4 MAJOR all FIXED and verified PRESENT in code: (1) no inline fulfill — run() only comps, no fix() call anywhere in tools/launch.ts; (2) metrics excludes source='launch' tools/db.ts:36-37; (3) claim-first marker(:54) before roast(:58); (4) interactionEvent launch guard tools/db.ts:9; (5) dedup scoped channel='launch' tools/launch.ts:52; (6) me()=env constant tools/launch.ts:24, no TwitterApi import (confirmed: launch.ts imports only sql/realReplies/xroast). MINOR #7 (stderr warn on 0-resolved) present tools/xread.ts:50; #8 fixed by #1. LOW #9 WONTFIX has a user quote; #10 documented ceiling (my finding #2); #11 pre-existing/OOS. All addressed per step-4 rules.
- slop-detector: not run for this chunk (optional per pipeline). Independent sweep: launch.ts exports run/arm/disarm all wired (scripts/tool.ts:48-50); mapReplies/replies both referenced + tested; no dead code, no unreferenced exports.
- security-review: security-review-log.md:9-23 — no HIGH/MEDIUM. Independently confirmed: all queries are parameterized postgres tagged templates (untrusted reply.id only enters parameterized inserts, tools/launch.ts:54,60); conversation_id:${tweetId} is digits-only via tweetIdOf on arm (tools/xroast.ts:17-19), targets the X API not a SQL boundary; no secrets logged. Unbounded-spend is by-design (engagement goal, kill-switch valve), correctly excluded from scope.
- manual-qa: manual-qa-log.md:51-65 — real CLI vs live DB + live X API (read/no-post): arm-via-URL round-trip, armed `launch run`→empty set, paused→`{reason:paused}`, disarmed→`{reason:disarmed}`, state restored, live xread tier OK, mapReplies join resolved 10/10 on a scratch search. Gated public e2e (real roast+fix on an image reply) honestly declared UNVERIFIED — needs an image reply + go-live auth. The harness-unreachable gap is called out, not glossed (correct per pipeline).

RESIDUAL (operator must close at go-live — declared, not hidden):
- R1: Validated-when #1 full public e2e (a real image reply → public roast reply → fulfill-worker fix reply in-thread) is UNVERIFIED — gated on (a) an actual ad-image reply existing on the launch tweet and (b) go-live posting authorization (manual-qa-log.md:64-65). The orchestration is covered by the 10 stubbed launch.test.ts cases (real comped-order shape asserted); xroast + fulfillOrder are pre-existing with their own live coverage. Acceptable to PASS pre-launch, but run one live smoke (one real image reply, kill-switch off) as the first go-live action and confirm: public roast posts, worker delivers the fix reply, ledger shows cost + revenue=0, the reply is not re-roasted next beat.

RECOMMENDATION: check off spec-14-launch and proceed to step 8 (commit). The core mechanic is correctly implemented and every acceptance criterion maps to a verified file:line; all 6 mandated code-review fixes (2 BLOCKER + 4 MAJOR) are present in code; the comped order is shaped to drain through the single fulfill-worker with no double-post race; both the source='launch' order and the channel='launch' marker are confirmed off every public sales/feed surface; security + non-gated QA are clean. Only minors remain (findings 1-4) and they stay logged — none gate. One operator action: run the live go-live smoke (R1) as the first armed beat to close the gated e2e.

---

## 2026-06-30T06:35:51Z, task spec-15 (`@adchad` summon)

**Diff target:** uncommitted working tree — `git diff HEAD` of tools/xread.ts, tools/xroast.ts, tools/launch.ts, tools/db.ts, scripts/tool.ts, skills/engage/SKILL.md, tests/tools/launch.test.ts + untracked tools/mention.ts, tests/tools/mention.test.ts, specs/spec-15-mention.md.
**Contract:** specs/spec-15-mention.md + plan peaceful-wobbling-ullman.md.

VERDICT: PASS

CHECKLIST COVERAGE (every spec-15 criterion/invariant → file:line):
- [x] Always-$5-sell / NEVER-comp invariant — tools/mention.ts run() inserts only the `interactions` claim (mention.ts:64); zero `orders` insert on any path. Contrast launch.ts:62-63 which comps `source='launch'`. Unit-asserted: mention.test.ts:91-92 (`orders.length === 0`). The asymmetry is real and intentional.
- [x] Cross-source dedup (the reopened BLOCKER) — BOTH runners widened: mention.ts:62 `where channel in ('launch','mention')` and launch.ts:54 `where channel in ('launch','mention')`. engage runs launch (SKILL step 0) before mention (step 0.5) → launch wins. Regression both directions: mention.test.ts:187-206 (sees a 'launch' claim → dup) and launch.test.ts:104-121 (sees a 'mention' claim → dup).
- [x] Self-roast loop guards (two layers) — (1) mention-author self-skip: mention.ts:57 case-insensitive `m.handle === me` → skipped reason=self (test mention.test.ts:158-170, live-verified 15×self in manual-qa-log.md:76); (2) ad-author self-guard in xroast: xroast.ts:48-49 throws "refusing to roast our own tweet" → mention.ts:76 classifies `/our own tweet/` as skip(self), not error.
- [x] interactionEvent excludes channel='mention' from /live — db.ts:10 `if (i.channel === 'launch' || i.channel === 'mention') return null`. Test mention.test.ts:224-228. Swept ALL other interaction readers in db.ts: feed (via interactionEvent→null, db.ts:198-201), metrics (counts prospects/orders only, mention writes neither — db.ts:29-38), page/halls/gallery/fixstatus/roastquota all scope to channel in ('x','roast','fix') direction='out' — the 'mention'/'in' marker matches none. No leak surface.
- [x] adTweetOf 3-step contract — xread.ts:adTweetOf: own media → `tweet.id` (screenshot) → else `referenced_tweets` replied_to → else quoted → else null. Order matches spec lines 7-10 and the live-resolution evidence (manual-qa-log.md:74-75). Tests cover all 6 branches incl. own-media-wins-over-parent (mention.test.ts:11-30).
- [x] xroast({tweet, replyTo}) threading — xroast.ts:27 `replyToId = opts.replyTo ? tweetIdOf(opts.replyTo) : id`; reply lands via xpost replyToTweetId=replyToId (xroast.ts:65). Roasts the AD (`tweet`/adTweetId), replies under the MENTION (`replyTo`/mentionId). Tests assert `{tweet: mentionId, replyTo: mentionId}` (own) and `{tweet: parentId, replyTo: mentionId}` (parent).
- [x] No-ad → one nudge, marked handled, no double-nag — mention.ts:68 claims marker then nudges; dedup prevents re-nag. Test mention.test.ts:114-133.
- [x] Kill-switch is the only valve — mention.ts:48-49 returns reason=paused before any work; no per-user cap (matches launch). Test mention.test.ts:208-222; live no-op manual-qa-log.md:77.
- [x] Wired into engage 15m cron beside launch — SKILL.md step 0.5 added; scripts/tool.ts `mention` dispatch (tool.ts:53-56) + both tool-list strings updated.
- [x] CLAUDE.md `adchad.ai` rule — grep of all 7 touched files: zero `vercel.app`. Only URL literal is `https://x.com/i/status/…`. CLEAN.
- [x] CLAUDE.md env-var-to-prod rule — `X_HANDLE` is NOT new (introduced spec-14 commit 3a58473, already in launch.ts); fallback `'adchadofficial'` is the real handle, so unset-in-prod is still correct. No new prod env var introduced.

ADVERSARIAL FINDINGS:
1. Cross-source regression tests lack a quoted isolated RED in run-log.md (severity: minor)
   evidence: run-log.md:87-93 quotes the RED for the original 16 mention tests only; the 2 cross-source tests (mention.test.ts:187-206, launch.test.ts:104-121) were added during the BLOCKER fix (code-reviewer-log.md:159) but no FAIL output is quoted for them. code-reviewer asserts "RED→GREEN regression tests both directions" without the quoted FAIL.
   required: For airtight TDD on a reopened BLOCKER, quote the pre-fix FAIL. MITIGATED to minor because: (a) RED is structurally guaranteed — each test directly exercises the widened SELECT predicate (before widening, the foreign-channel marker would not match → roast called → assertion roastCalls===0 fails); I verified this by inspection. (b) Both tests are present and GREEN (launch 11 + mention 17 = 28 passed; full suite 114 | 3 skipped per code-reviewer-log.md:167). (c) Established project precedent already accepts this exact class: run-log.md:80 ("2 regression tests lack isolated RED — acceptable, logged"). Non-blocking.

UPSTREAM STAGE VERIFICATION:
- test-engineer (main-context this session): RED 16 FAIL quoted (run-log.md:87-93) → GREEN 16 pass + full 112; cross-source fix later took mention→17, launch→11, full→114. Original RED→GREEN airtight; cross-source RED unquoted but structurally guaranteed (finding 1). VERIFIED w/ minor.
- code-reviewer: spec-15 section, high-effort 2-angle. 1 BLOCKER (cross-source double-roast) FIXED — confirmed present at mention.ts:62 + launch.ts:54. 1 MAJOR (20→100 cap starvation) FIXED — confirmed xread.ts max_results:100 + ponytail ceiling comment. 3 MINORs WONTFIX with rationale (at-most-once tradeoff, X_HANDLE dup, run-skeleton dup) — all defensible, match launch precedent. No unaddressed BLOCKER/MAJOR. VERIFIED.
- slop-detector: not run this chunk (folded into code-reviewer 2-angle cleanup pass; no dead code in diff — every new export consumed: adTweetOf by mapMentions+tests, mapMentions by mentions()+tests, mention.run by scripts/tool.ts). VERIFIED (no gap).
- security-review: spec-15 section — no HIGH/MEDIUM. Traced SQLi (parameterized), reply-injection (@handle X-constrained, mention text ignored v1), arbitrary-tweet-roast (designed feature, mitigated by self-guard + paused), no-new-secrets, mention path comps no order. VERIFIED.
- manual-qa: spec-15 section — live mention read (15 items, upgraded shape), adTweetOf own-media + reply branches on real data, self-skip 15×, kill-switch no-op, DB-effect suite green. Public 3rd-party e2e UNVERIFIED, declared/gated (our only X login self-skips — same honest gap spec-14 declared). VERIFIED with declared residual.

RESIDUAL (operator must close at go-live — declared, not hidden):
- R1: Validated-when #1/#2 full public e2e (a real 3rd-party `@adchad` mention → public roast reply threaded under the mention, $5 link, owner @-tagged, no order comped) is UNVERIFIED — gated on a third-party X account (our `@adchadofficial` login is filtered by the self-skip). manual-qa-log.md:80. Orchestration + the no-order guarantee are unit-tested (live DB, stubbed roast); xroast/xpost are pre-existing with spec-14 live coverage. Acceptable to PASS pre-launch; run one live smoke from an external account as a go-live action.

RECOMMENDATION: check off spec-15-mention and proceed to step 8 (commit). Every acceptance criterion and invariant maps to a verified file:line. The reopened BLOCKER (cross-source double-roast) is correctly fixed in BOTH runners with regression coverage in both directions; the always-$5-sell / never-comp invariant holds (zero orders insert on any mention path, asserted); both self-roast loop guards are present; the channel='mention' marker is confirmed off EVERY public reader (feed/metrics/page/halls/gallery/fixstatus/roastquota). Security + non-gated QA clean; CLAUDE.md URL + env-var rules clean. One minor (finding 1: cross-source RED not quoted) stays logged and does not gate — it follows the spec-14 accepted precedent and the RED is structurally guaranteed. One operator action: live external-account smoke (R1) at go-live.

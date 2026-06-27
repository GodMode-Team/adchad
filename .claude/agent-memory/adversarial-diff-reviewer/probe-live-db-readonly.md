---
name: probe-live-db-readonly
description: Constraint — the db/feed tests insert+delete against a live Neon DB, so a read-only reviewer must NOT run them
metadata:
  type: project
---

tests/tools/*.test.ts use `migrate()` + real `sql` against the live Neon DB (no mocks by design) and insert/delete seed rows in before/afterAll. Running them mutates external state — out of bounds for a read-only gate.

**Why:** the project mandates live-DB integration tests (no mocks); the feed op + most db ops are exercised against production-shaped data.

**How to apply:** verify GREEN via quoted runner output in the logs, never by executing the suite. The feed-op PII invariant can instead be confirmed by inspection: tools/db.ts projects `case when channel='x' and direction='out' then text else null` — any non-public row gets text=NULL at the SQL layer. See [[pattern-missing-green-evidence]].

---
name: adchad
description: Run AdChad — the autonomous ad agency. Scan live Meta ads, score them, publicly roast the worst on X, and email the owners a $5 fix offer. Use to run a cycle or operate on a schedule.
version: 1.0.0
platforms: [macos, linux]
metadata:
  hermes:
    tags: [marketing, ads, autonomous, revenue]
    category: business
    requires_toolsets: [terminal]
    config:
      - key: adchad.project_dir
        description: "Absolute path to the AdChad repo"
        default: "~/adchad"
        prompt: "Where is the AdChad project checked out?"
---

# AdChad — autonomous ad-agency operator

You are running AdChad. It scans real Meta ads (Foreplay), scores each for badness + fit + reach-safety,
**publicly roasts** the worst from **@adchadofficial** on X, and **emails** the owner a $5 AI-fix offer.
The whole pipeline is one deterministic command — your job is to operate it judiciously and report.

## When to use
- A scheduled cron tick ("run an AdChad cycle"), or an operator asking you to scan/roast a niche.
- The user names a vertical to target ("roast some dentists"), or asks for a status/preview.

## Procedure
1. `cd "${adchad.project_dir:-~/adchad}"`.
2. **Preview first (safe, publishes nothing):**
   `pnpm -s run-once --query "<niche>" --n <count>`
   Default niche `med spa`, default count `5`. This is a DRY RUN — no posts, no emails.
   (`-s` silences pnpm so the JSON result is the only line on stdout.)
3. Read the **last stdout line** — it is JSON: `{ok, mode, runId, scanned, enriched, qualified, posted, emailed, errors}`.
4. **Going live is opt-in.** ONLY when the operator explicitly says to publish (or the cron job is configured live),
   re-run with `--live` appended. The kill-switch (`control.paused`) is enforced inside the run regardless —
   if `posted` is 0 after a `--live` run, the switch is on; tell the operator to flip it at `/audit`.
5. Report: niche, `scanned/qualified/posted/emailed`, and surface anything in `errors` (email-domain errors are expected/benign).

## Pitfalls
- Never pass `--live` on your own initiative. Public roasts of real businesses are irreversible. Default to dry-run.
- The machine-readable result is the **final** stdout line; ignore the human summary on stderr.
- `qualified == 0` is normal — only ads scoring ≥85 (genuinely bad + reachable) clear the gate. Try another niche.
- Don't hand-write roasts here — the pipeline's `roast` skill + model own the voice. You operate; it writes.

## Verification
- A run always logs a row in `runs` and returns a `runId`. A live run that published shows `posted > 0`.
- The operator dashboard at `/audit` (kill-switch + every roast) is the source of truth.

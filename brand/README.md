# AdChad — Brand, Voice & Quality Standards

The source-of-truth for **how Chad looks, talks, writes, and what "good" means.** The `skills/` at the repo root are the agent's lean *operational* runtime skills (what to do, which tools to call). This `brand/` directory is the *quality layer* underneath them — the full character bible, the canonical copy pipeline, and the taste bar. Wire the operational skills to pull from here when depth matters.

## What's here

| Path | What | Use when |
|---|---|---|
| `CHARACTER.md` | **Character & brand bible** — who Chad is, the crude visual identity, palette/type, voice, catchphrases, motifs (grim-reaper doors, BAD→CHAD, $5 ding), offer ladder, tech identity, live assets. | Any Chad-facing visual, video, page, or persona decision. **Read first.** |
| `taste/TASTE.md` | The 7 Laws + anti-slop standard (general). | The quality spine for everything. |
| `taste/TASTE-RUBRIC.md` | How taste is scored (≥8/dimension to ship). | Reviewing any customer-facing artifact. |
| `taste/ADCHAD-TASTE-PACK.md` | The taste laws tuned to Chad's deliberately-crude brand + an AdChad anti-slop blocklist + the "Chad gut-check." | Before shipping any roast page, ad, or video beat. |
| `standards/copy/SKILL.md` | **Canonical copy pipeline** (Caleb's most up-to-date / highest-quality, synced from the prosper brain). Voice → Quality Gate → Humanizer. | Any external-facing writing: roasts, ads, landing pages, emails, reports. |
| `standards/copy/references/` | Deep-dive references incl. `voice-bible-v2.md`, `humanizer.md` (24 AI-writing patterns), `adchad-recurring-email-microagent.md`, `adchad-prospecting-icp-and-hackathon-scorecard.md`, `autonomous-ad-critique-microagency.md`, `text-heavy-ad-graphic-workflow.md`, `meta-saved-ads-swipe-file.md`. | When the copy task needs the full method, the ad swipe file, or the AdChad business pattern. |
| `standards/copy-quality-gate/SKILL.md` | The adversarial quality gate (ruthless competitor / cynical consumer / distracted scroller). | Stress-testing any copy before it ships. |

## Why this is here

The repo's root `skills/copy/SKILL.md` was a ~40-line portable stub. The canonical copy skill — the most up-to-date and highest-quality version Caleb maintains — is **352 lines + a references library**, synced here as `standards/copy/`. The visual + voice **character guidelines** and the **taste system** existed across the godmode memory and the video production work but had never been consolidated into the repo. Now they're all in one place.

## How to apply (precedence)

1. **Voice & look** → `CHARACTER.md` (non-negotiables: crude Chad, deadpan, succinct, close on the $5).
2. **Writing** → `standards/copy/SKILL.md` → gate with `standards/copy-quality-gate/` → humanize via `references/humanizer.md`.
3. **Ship check** → `taste/ADCHAD-TASTE-PACK.md` gut-check + `taste/TASTE-RUBRIC.md` (≥8/dim).

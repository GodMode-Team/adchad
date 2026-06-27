# TASTE-RUBRIC — the gate (score any artifact, won't pass slop)

> The enforcement instrument for [[TASTE.md]]. Score 0–10 per dimension. **Ship bar = ≥8 on every applicable dimension AND zero blocklist hits.** Use in `/taste` reviews, inside refinement loops (write scores to SCORES.md, rewrite the weakest, re-score), and before any launch/merge. Skip dimensions that don't apply (mark N/A) — never average around a failure.

## How to score
- Be adversarial, not generous. Default a borderline call DOWN. A 7 is "competent but I've seen it before" — that's a fail, not a pass.
- Any **anti-slop blocklist hit (TASTE.md) = automatic cap at 4** for that dimension, regardless of other quality.
- For visual/code, run `npx impeccable detect` first; unresolved detector findings cap the relevant dimension.

## Universal dimensions (every artifact)
| # | Dimension | 0–4 (slop) | 8–10 (ships) |
|---|---|---|---|
| 1 | **Anti-slop / non-reflex** | looks/sounds like generic AI output; reflex defaults intact | clearly chose against the default; distinctive on purpose |
| 2 | **Detail / finish** | empty states, error copy, edges ignored; "good enough" | the unasked-for polish is there; second-order cases handled |
| 3 | **Specificity** | vague, generic nouns, no real numbers | concrete, named, exact; specific beats clever |
| 4 | **Voice fidelity** | corporate/hedge/AI-cadence; wrong register | unmistakably ours (per surface pack); a human with taste wrote it |
| 5 | **Restraint** | loud, busy, 5 accents, chrome-heavy | calm, one accent, whitespace as frame; confidence not volume |
| 6 | **Trust earned** | asks before giving; claim before proof; feels cheap | earns the right to the ask; mirror→mechanism→claim; feels premium/credible |

## Visual / UI add-on dimensions
| 7 | **Typography** — real type system, scale, rhythm (not Inter-default) |
| 8 | **Color** — intentional palette, contrast, not the AI-startup gradient |
| 9 | **Layout/space** — grid + spacing rhythm, not centered-hero-3-cards |
| 10 | **Motion/interaction** — purposeful micro-interactions, loading feel, reduced-motion respected |
(Detector: `npx impeccable detect` must be clean or findings triaged.)

## Copy / ad / video add-on dimensions
| 11 | **Hook** — stops scroll in <2s; not a generic promise |
| 12 | **Mirror-before-claim** — reflects their reality before any number (MIRROR-FIRST law); number is earned + last |
| 13 | **CTA architecture** — low-threat next step that delivers value (not "apply"/"book a call" cold); risk-reversal on the ad |
| 14 | **Proof as story** — named subject + arc, not a stat wall |

## Product / code add-on dimensions
| 15 | **Empty/error/loading states** — designed, not default |
| 16 | **Information hierarchy** — the one thing first; progressive disclosure; ≤ what's needed |
| 17 | **Performance feel** — instant, no stale data, no jank (@brotzky "stupid fast") |

---

## The pre-flight ritual (run BEFORE producing — this is half the score)
1. **Name the reflex default** out loud ("the model wants to: center a hero, use a blue gradient, write 'elevate your practice'…").
2. **Reject it.** Pick the deliberate alternative (anti-attractor).
3. **Propose 3–4 directions** (visual or angle) before committing to one. (Fable defaults to a strong house style — break it on purpose.)
4. **Write the brief** (who/what/feeling/exemplars) before the artifact. `/shape` style.

## Loop integration (token-efficient, files-as-memory)
```
Each pass: score the artifact against TASTE-RUBRIC (write to SCORES.md), find the lowest dimension, fix ONLY that, re-score.
DONE when every applicable dimension ≥8 AND zero blocklist hits AND (if code) detector clean.
Output <promise>TASTE-PASS</promise> with the final score table.
```

## Surface bars (where to set the floor)
- **Cara** — ship bar = 9 (it's the trust product; a 7 reads as "another AI tool").
- **TRP ads/creative** — ≥8, plus dims 11–14 mandatory.
- **Internal tools** — ≥8 on 1–6; visual dims relaxed unless customer-facing.

# TASTE — the standard for everything we ship (Cara · TRP · internal)

> Company-brain layer. This is the context every other layer inherits (@shannholmberg's "company brain = the context every layer inherits"). Built 2026-06-15 from Caleb's curated bookmarks + the current best thinking on taste in AI products + the brand/voice foundation already in the repos. If an output can't pass the TASTE-RUBRIC, it does not ship.

## Why taste is now THE moat
Everyone can vibe-code the easy 80%. The differentiator is the 20% you can't vibe-code. @nikunj: *"quality, depth and great systems still have value and take time. You can't vibe code lessons. Now and forever."* @bbssppllvv: *"Agents make ugly UIs because they've never seen good design."* The default output of any model is **monoculture slop** — reflex defaults (purple gradients, Inter everywhere, generic card grids, "elevate/unlock/seamless"). Taste is the discipline of **rejecting the reflex default and getting the details right.** For us it's existential: Cara asks chiropractors to trust an AI with their patients and their numbers — cheap/sloppy = dead on arrival (our own ad research: trust-elastic, not claim-elastic).

## What taste IS (operating definition)
Taste = the gap between what you can *perceive* as excellent and what you actually *produce* — closed by (1) consuming the best relentlessly, (2) rejecting your first reflex, (3) caring about the details no one asked about. It is not subjective vibes; it is a **checkable standard** (see TASTE-RUBRIC.md) and a **toolchain** (below).

---

## The 7 Laws (apply to UI, copy, ads, video, product, code — everything)

1. **Anti-slop is the floor.** Before producing, enumerate your reflex defaults and *reject them* (@pbakaus's anti-attractor). No purple/blue gradients, no Inter/Roboto/system-font-only, no generic card grid, no stock-photo smiles, no "in today's fast-paced world." If it looks/sounds like every other AI output, it fails.
2. **Details are the product.** The Slack-notification-system principle (@nikunj) — the polish nobody asked for is the thing people feel. Micro-interactions, empty states, error copy, loading, spacing rhythm, the second-order cases. @brotzky: "all the little details."
3. **Specific beats generic, always.** Named client + real number, the concrete noun, the exact figure. (This is already our ad wedge — Bryne Willey $650K→$1.75M, the open lane nobody runs.) Vague = invisible.
4. **Restraint = confidence.** Calm over loud. Our UI baseline is the Hermes "calm console": conversation/content first, metadata and chrome quiet below, almost no shadows, clear spacing. One accent, not five. Whitespace is not empty — it's the frame.
5. **Voice is non-negotiable and it's OURS.** Never corporate, never hedge, never AI-cadence. Internal/Caleb = Voice Bible (kinetic, direct, anti-guru, no em-dashes, no "elevate"). TRP = Franson voice ("right so," "remarkable," earnest high-energy teacher). Cara = warm-competent clinical trust (see Cara pack). The wrong voice is slop even if the design is clean.
6. **Premium is a trust signal, and trust is the conversion.** For Cara especially: every pixel/word either earns or spends trust with a skeptical clinician. Mirror their reality before you make a claim (our MIRROR-FIRST law: mirror → mechanism → number-last → risk-reversal). Taste in persuasion = earning the right to the number.
7. **Design before code; propose before commit.** No reflex first-draft. Run a discovery/brief first (@pbakaus `/shape`), and for anything visual **propose 3–4 distinct directions before building one** (also Fable's own best practice — it has a strong default house style that must be broken on purpose). Ship a *designed* thing, not the model's first card grid.

---

## The Anti-Slop Blocklist (the negative space — memorize it)
**Visual:** the "AI Purple/Blue glow" gradient (the Lila tell); Inter/Roboto/system-font as the *default* (reach for Geist, Satoshi, Cabinet Grotesk, or Outfit first — Inter is only right when neutral/Linear-style/accessibility-first is the actual ask); the two LLM-favorite display serifs **Fraunces** and **Instrument Serif** (banned as defaults — serif is for genuine editorial/luxury/heritage only; "creative brief = serif" is the single most-tested AI tell); the default premium-consumer palette (warm beige/cream + brass/clay/oxblood + espresso text — the `#f5f1ea` / `#b08947` / `#1a1714` family; rotate to a different family every project, never ship it twice in a row); pure black `#000` (use off-black/zinc-950); centered hero + 3 equal feature cards + CTA; 3+ consecutive image/text zigzag rows; rounded-everything or mixed corner-radius systems; drop-shadow soup and pure-black shadows on light; neon outer glows; custom cursors; emoji as personality; stock smiling headshots; rainbow accent palettes; **div-based fake product screenshots** (the #1 frontend tell); the "AI startup" look.
**Eyebrows & micro-labels (the most-violated tell):** an uppercase-tracking eyebrow above *every* section (ration it: max 1 per 3 sections, hero counts as 1); section-number labels (`001 · Capabilities`, `06 · how it works`, `00 / INDEX`); `01 / 4` pagination on tiles; version stamps in the hero (`V0.6`, `BETA`, `INVITE-ONLY`) unless it's a real launch; decorative middle-dot strips (`BRAND · MOTION · SPATIAL`); decorative status dots before nav/list items; scroll cues (`↓ Scroll to explore`); locale/weather strips (`LIS 14:23 · 18°C`); photo-credit captions as decoration (`Frame XII · 35mm`); `Stage 1 / Stage 2` step labels; `border-t` + `border-b` on every row of a long list.
**Copy:** "elevate, unlock, seamless, leverage (as verb to readers), revolutionize, in today's fast-paced world, we're excited to, game-changer, robust, cutting-edge, next-gen"; the **em-dash is a hard zero** — none in headlines, body, eyebrows, captions, attribution, or buttons (use a period, comma, colon, or hyphen); en-dash separators too (ranges use a hyphen); hedging ("might, perhaps, it depends"); exclamation spam; perfect parallel triplets; corporate throat-clearing; "Quietly trusted by / Quietly in use at"; performative-craftsman labels ("Field notes", "On our desks", "From the field"); cute-but-broken AI wordplay; fake-precise invented numbers (`92%`, `4.1×`) the brand doesn't actually claim; generic names (Jane Doe / Acme / Nexus / SmartFlow).
**Product/UX:** dead empty states; generic error toasts; no loading feel (use skeletons that match the final shape, not spinners); settings before value; asking before doing; modal-on-modal; 7 nav items when 3 will do; nav that wraps to two lines at desktop; CTA labels that wrap or duplicate intent ("Get in touch" + "Let's talk" on one page); white-on-white / unreadable buttons; placeholder-as-label.
**Persuasion:** opening cold on a number (0% belief — "a slide, not a P&L"); claim before mirror; "results guaranteed"; testimonial wall with no story; CTA that asks for commitment before delivering value.

> **For frontend specifically**, the full mechanical tell-list + the design-system map + a 50-item pre-flight gate live in the **Frontend pack** (`packs/FRONTEND-TASTE-PACK.md`). Harvested 2026-06-26 from tasteskill.dev (Leonxlnx/taste-skill) production-test rounds, folded into our architecture. The pack is the generation manual; `npx impeccable detect` is still the deterministic merge gate.

---

## Architecture — 3 layers, inherited everywhere

**Layer 0 — This spine (TASTE.md).** The universal standard. Lives in company brain; every prosper agent + every Claude Code session inherits it. Non-negotiable across all surfaces.

**Layer 1 — Per-surface Taste Packs** (the @bbssppllvv DESIGN.md pattern: the reference context a model *reads before producing* for that surface). Each pack = palette + type + spacing + voice + do/don't + **named exemplars** ("Cara should feel like Linear × a great clinician; sound like ___").
- **Cara pack** — BUILD (blank slate). Inherits: Caleb Voice Bible + Hermes calm-console + healthcare-trust. The single highest-leverage missing asset.
- **TRP pack** — CONSOLIDATE existing into one pack: TRP-BRAND-STRATEGY-GUIDE + FRANSON-VOICE-GUIDE + fransonisms + the MIRROR-FIRST ad law.
- **Internal pack** — GodMode BRAND-GUIDE + Caleb VOICE-BIBLE + PRINCIPLES/SOUL.

**Layer 2 — Enforcement (the 4 teeth that make it "everywhere," not a doc that rots):**
1. **`/taste` review (LLM gate)** — scores any artifact against TASTE-RUBRIC.md, 0–10 per dimension, won't pass slop. Plugs into the refinement loops we already run (the SCORES.md pattern) and as a standalone review. Mirrors @pbakaus `/critique`.
2. **The detector (deterministic, no-LLM)** — adopt **`npx impeccable detect`** (impeccable.style) on every code/UI surface (hermes-webui/Cara UI, lifetrack, sites): CI-ready scan for 25 anti-patterns → wire into PR/Stop-hook so **slop literally cannot merge.** This is the hard tooth.
3. **Anti-attractor + design-before-code ritual** — Law 1 + Law 7 as a required pre-step in every build/creative loop: enumerate-and-reject reflex defaults, then propose 3–4 directions, then build. (`/shape` → brief → `/impeccable craft`.)
4. **Synth-swarm taste test** — our synth-swarm already simulates customers; add a perception dimension: do synthetic chiros read this as *premium/trustworthy* or *cheap/AI-slop*? Taste, validated against the audience, not just our eye.

**Inheritance:** TASTE.md → company brain (here) so every Prosper agent inherits it; → godmode context / CLAUDE.md so every Claude Code session inherits it; → each loop prompt references the rubric. That's how "everywhere" actually happens.

---

## How to use it (the one-liner for every piece of work)
> Before you build/write/cut: name the reflex default and reject it (Law 1). Propose directions, don't commit to the first (Law 7). After: run `/taste` (and the detector if it's code). If it scores below bar on any dimension, it doesn't ship — iterate the weakest (the loop pattern).

_Sources: @pbakaus (Impeccable / anti-attractor / detector), @bbssppllvv (DESIGN.md-as-context), @nikunj (details/can't-vibe-code-lessons), @brotzky, @shawmakesmagic (anti-slop), @shannholmberg (company-brain inheritance), kepano/Steph Ango (taste = perceive-vs-produce gap), tasteskill.dev / @milesdeutscher rec (Leonxlnx — concrete frontend AI-tell list + design-system map, folded into the blocklist + Frontend pack 2026-06-26). Internal: VOICE-BIBLE-v1, TRP-BRAND-STRATEGY-GUIDE, FRANSON-VOICE-GUIDE, GodMode BRAND-GUIDE, hermes-webui DESIGN.md, PRINCIPLES.md/SOUL, TRP MIRROR-FIRST ad law (synthcheck 2026-06-15)._

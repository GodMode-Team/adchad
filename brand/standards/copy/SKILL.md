---
name: copy
version: 1.1.0
description: |
  Unified copy pipeline for ALL external-facing writing: emails, websites,
  landing pages, ads, reports, client docs, and marketing copy.
  Three stages: (1) Write in Caleb's voice first, (2) Quality gate with
  adversarial personas and specificity audit, (3) Humanize — strip any AI
  patterns that crept in. Voice is the foundation, not the finish.
  Run this skill on ANY writing task that goes to someone outside the team.
triggers:
  - "check this copy"
  - "run copy check"
  - "humanize this"
  - "voice check"
  - "write an email"
  - "draft an email"
  - "write copy"
  - "draft copy"
  - "write a landing page"
  - "build a landing page"
  - "write an ad"
  - "build a swipe file"
  - "analyze saved ads"
  - "Facebook saved ads"
  - "Meta Ad Library"
  - "draft a report"
  - "deliver as an HTML site"
  - "turn this into a site"
  - "make this a training site"
  - "client email"
  - "write this up"
  - "/copy"
  - "/copy-check"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
---

# Copy Pipeline — Voice First, Gate It, Then Clean It

One skill. Three stages. Run on everything before it ships.

**Pipeline:** Caleb's Voice → 5th Grade Clarity Pass → Quality Gate → Humanizer → Ship

Voice is the foundation. Clarity is non-negotiable. Quality gate pressure-tests it. Humanizer is the final polish.

## Global copy rule: 5th grade clear

Default every external-facing draft to a 5th grade reading level unless Caleb explicitly asks for a more technical register.

**Clear over clever. Never better.**

What that means:
- Short words beat impressive words.
- One idea per sentence.
- Say the thing plainly before making it pretty.
- If a line is clever but slower to understand, cut it.
- If a phrase sounds like copywriting, rewrite it like a human would say it.
- The reader should never have to decode the point.

Final clarity test:
1. Could a tired, distracted buyer understand it in one pass?
2. Could a smart 10-year-old explain the point back?
3. Did we choose a clever line where a clear line would sell better?

If #3 is yes, clear wins.

**Reference files for deep dives:**
- Voice Bible v2 — `~/godmode/memory/projects/caleb-os/final/voice-bible-v2.md`
- `references/text-heavy-ad-graphic-workflow.md` — deterministic workflow for readable text-heavy ad graphics, scorecards, matrices, and comparison cards.
- `references/autonomous-ad-critique-microagency.md` — BeatMyAd / autonomous ad-critique micro-agency pattern: $5 SynthCheck-backed static audit, money-back guarantee, autonomous prospecting loop, Stripe fulfillment, and Higgsfield static/video upsells.
- `references/adchad-recurring-email-microagent.md` — AdChad-style autonomous ad-roast micro-agent pattern: self-prospecting loop, public/email roast outreach, $5/$19/$49 ladder, weekly fulfillment, competitor monitoring, synthetic customer critique, ROI calculator, and Cara/chiro repurpose.
- `references/adchad-prospecting-icp-and-hackathon-scorecard.md` — AdChad ICP, prospecting sources, scoring model, hackathon advisor scorecard, SynthCheck proof requirements, and first-place demo criteria.
- `references/html-training-site-deliverable.md` — turn research packs/teardowns/markdown reports into polished, verified static HTML training sites with Tailscale URL + zip handoff
- `references/customer-facing-vision-site-media-assets.md` — media/avatar/proof upgrade workflow for high-design vision sites; use when Caleb says a page looks like AI/SaaS slop or provides a video/avatar asset
- `references/humanizer.md` — full AI-writing-pattern guide formerly in `humanizer`; use as the detailed reference for internal/external humanization passes.
- [[copy-quality-gate]] — full Maxwell Finn quality gate framework
- [[lifetrack-audio]] — private Caleb-style Lifetrack / hypnosis / affirmation audio workflow. Use this instead of treating bedtime/personal-growth tracks as normal external copy.

---

## Swipe-file ingestion from saved ads

When Caleb wants to build swipe files from Facebook/Meta saved ads, prioritize account safety over convenience.

**Default sequence:**
1. For Caleb's owned Pages/ad accounts, use scoped Meta OAuth / Meta Ads API access to inventory ad accounts, Pages, ads, creatives, copy, thumbnails, preview links, destination URLs, and performance fields where permitted.
2. For personal Facebook Saved Ads / saved items, do **not** ask for or accept Facebook passwords, 2FA codes, cookies, or session exports.
3. If account restriction risk matters, avoid live Facebook UI automation from a VPS or unfamiliar browser. Recommend Facebook's official data export instead: Accounts Center → Your information and permissions → Export your information → Create export → select profile → Export to device → specific information: **Saved Items and Collection** → all time → JSON.
4. Have Caleb download the ZIP himself and provide it. Parse locally into a structured swipe file.
5. If export data is incomplete, reconstruct what is possible from saved URLs/titles/collections, then use public Meta Ad Library/Page URLs for recoverable ads.

**Swipe-file fields to extract/classify:** advertiser, Page URL, ad URL/source URL, collection, saved date if available, hook, angle, offer, mechanism, proof, audience, CTA, landing page, creative notes, swipe value, and reusable pattern.

---

## Text-heavy ad graphics

When Caleb asks for a graphic/ad creative where the text must be readable — tier lists, checklists, matrices, scorecards, comparison tables, quote cards, or diagnostic graphics — use `references/text-heavy-ad-graphic-workflow.md`.

Core pattern:
1. Prefer deterministic layout output over image-model generation. Build SVG/HTML/CSS/canvas/Pillow so the text, hierarchy, and CTA render cleanly.
2. Default social-feed ad size to 4:5, 1080×1350, unless Caleb specifies another placement.
3. Draft short claim-safe copy first, then render the graphic. Keep source/edit file with the final PNG.
4. Run a visual QA pass before handoff: mobile readability, clipping, CTA overlap, typos, and unsupported claims.
5. If QA finds issues, fix and re-render before sending the final `MEDIA:` file.

---

### Operational client updates

When drafting client boundary, termination, or reputation-risk emails, especially when Caleb is angry, keep the email screenshot-safe: calm, specific, final, and low on debate hooks. Translate “shut the fuck up” into “remove or correct the post,” “stop making false or misleading statements,” “public speculation in groups where we cannot respond creates reputational harm,” and “we reserve all rights.” Do not include insults, “ungrateful,” “my team hates working with you,” or emotional grievance language, even if true. If the client has publicly misrepresented the company, name the disputed claims in bullets and ask for correction/removal; if revenue pressure exists, choose between a paid scope reset and termination before drafting. For PA/chiro examples, see `growth-strategy-and-revenue-ops/references/pa-high-load-client-termination-reputation-risk-2026-06.md`.

When Caleb asks for MLS/Zillow/Realtor copy or a broker-ready listing handoff, use `references/real-estate-listing-copy.md`.

Core pattern:
1. Give the broker one pasteable chunk, not five competing versions, unless Caleb explicitly asks for options.
2. Lead with the buyer's decision frame: location, builder quality, price/value contrast, space, private yard, and practical convenience.
3. Translate unknown status signals. If a builder name matters, explain why it matters in buyer language and verify the claim before using it. Example: "seven-figure Austin luxury builder" beats simply naming the builder.
4. Sell practical luxury, not generic luxury: main-level primary, open flow, hosting, work-from-home flexibility, private low-maintenance yard, efficient systems.
5. Remove stale claims tied to outdated photos or changed property condition, especially landscaping/tree-view language.
6. Keep disclosures short and present when photos are virtually staged or digitally enhanced.

**Pitfalls:**
- Facebook personal Saved Ads are usually not available through the Meta Ads API.
- VPS/noVNC/browser harvesting can trigger unfamiliar-login, 2FA/checkpoint, rate-limit, or scraping signals, especially across years of saved items.
- Do not trade a full-account login for a narrow copy-research task. Use export/OAuth boundaries.

### HTML training sites from reports / teardowns

When Caleb asks to deliver a research pack, teardown, or training doc “as an HTML site,” use `references/html-training-site-deliverable.md`.

### Customer-facing vision sites

When Caleb asks for a website/demo to make a product or venture vision grounded for partners or clients, use `references/customer-facing-vision-sites.md`. Default to the public buyer-facing homepage first, not an internal strategy page. The strategy packet can support the conversation after the audience understands the product.

### Founder / operator bio credibility lines

When Caleb asks to add a credential to a founder/operator bio, make it a credibility hit, not a résumé paragraph. Use one punchy sentence that names the credential and explains why it matters in buyer language. Pattern: “Gauntlet graduate: a high-pressure AI builder program where engineers ship working agent systems, not slide decks.” Avoid provenance phrasing (“source confirms”), vague prestige inflation, or burying the credential after generic “technical builder” copy.

If Caleb says the page looks like AI/SaaS slop, asks for high design, or provides a video/avatar asset, also use `references/customer-facing-vision-site-media-assets.md` before delivery. A polished static page with copy/cards is not enough in that case; the deliverable needs a real visual system and media layer.

Core pattern:
1. Build a self-contained static `index.html` with embedded CSS/JS, not a loose markdown export.
2. Preserve the source analysis unless asked to rewrite it; improve packaging, hierarchy, navigation, and readability.
3. For high-value product concepts, avoid generic AI/SaaS card-stack output. Use a concrete value architecture: what the product does, what it replaces, what it saves, what it helps the buyer/team do next, and what tangible outputs the buyer receives.
4. If Caleb asks for “high value design,” “not AI slop,” a website concept, or a product vision site, treat the design layer as part of the deliverable, not decoration: restrained headline, distinctive hero graphic, motion/animation or product film, simulated UI, visual proof/case-file modules, and browser visual QA before handoff.
5. If Caleb supplies a video/avatar link or asks why one was not used, attempt to extract or download usable media and integrate it locally before substituting abstract placeholders. Use the asset visibly: hero cutout, `Meet [Product]` module, phone-style vertical video, or host badge. Pair the human/avatar layer with the product-operating visual so the page shows both personality and mechanism.
6. Include a hero, product-preview/simulated UI, key stat/value cards, sticky/table-of-contents navigation where useful, carded sections, responsive tables/cards, and print/save-PDF styling when relevant.
7. If real proof is not yet approved, do not invent proof. Show concrete sample deliverables instead: memo, scorecard, huddle agenda, scripts, follow-up card, campaign brief, approval log, or decision memo.
8. When Caleb explicitly asks for “high value design,” says it must not look like AI slop, or asks for an adversarial agent, run an adversarial website-strategist critique before delivery, apply must-fix items, then run a post-fix audit.
9. Verify in browser and check for obvious render/JS/media issues.
10. If Caleb needs to share/view it, serve it and provide a verified Tailscale hostname URL, plus local HTML/zip files via `MEDIA:`.
11. For healthcare-adjacent sites, include source posture and a clear data boundary: clinic-level/aggregate work first, patient-level/PHI workflows only after approved secure setup; do not make broad compliance claims without verification.
12. For team-facing SOP/training pages, make the page recipient-ready, not just internally complete: strip weird internal lingo, replace placeholders, put the primary action link above the fold, and remove mock/unfinished automation modules until they are actually wired up.

---

## Stage 1: Write in Caleb's voice

Start here. Everything else builds on this. If the voice isn't right, no amount of quality gating or humanizing will fix it. Reference: Voice Bible v2.

### The five voice rules

**1. Intensity oscillation**
Caleb swings between raw intensity and calm precision — often in the same paragraph. Never flatten to one register. He can go from "I am one with God" to "What the fuck happened?" in two messages.

**2. Action-first framing**
Every idea ends with a concrete next step. If a paragraph doesn't end with what to do, it's not Caleb's voice. Even introspection becomes a systems question.

**3. Earned confidence (not arrogance)**
Bold claim → specific evidence → action step. Never bravado without backup. Sometimes the most confident move is recommending against yourself.

**4. Warmth through directness**
Show care by being efficient with people's time and honest about the situation. Not performatively empathetic. Lead with the fix, not the problem.

**5. Spiritual-technical fusion**
Consciousness language and hard metrics coexist naturally. Don't separate them. "Consciousness upgrade → here's the DAU metric." Context-dependent: dial up for brand copy, dial down for client emails.

### Anti-patterns (never do this)

| Don't | Do instead |
|-------|-----------|
| "Dear Dr. Smith, I hope this email finds you well" | "Hey Dr. Matt," |
| "Perhaps we might consider..." | "Here's what I'd do." |
| Wall of text | Bullets, headers, bold the key point |
| "Sorry to bother you..." | Lead with value or solution |
| Separate spiritual from tactical | Blend them naturally |
| Fake urgency ("Only 3 spots left!!!") | Real data: "Every quarter costs you $50K" |
| Passive voice: "The issue was identified" | "We found it and fixed it" |
| Guru posturing: "As a thought leader..." | Let results speak. Show the numbers. |
| End without action | Every section ends with what to do next |

### Words Caleb would never use

synergy, leverage (as buzzword), touch base, circle back, per my last email, thought leader (self-referentially), it is what it is, best practices, scalable solution, learnings, at the end of the day, innovative, cutting-edge, I'd be happy to assist, please don't hesitate to reach out, utilize, regarding, moving forward, tangible deliverables, technology-agnostic, holistic approach

### Words Caleb actually uses

"Here's the deal", "The reality is", "Point being", "Lock in", "Ship it", "Let's go", "I got you", "Hit me up", "What actually works", "from here", "Cheers!", "sick", "killer", "real numbers, no fluff", "no sequences, no drip, just the goods"

### Platform voice map

| Context | Voice register |
|---------|---------------|
| **Sales page / brand** | Elevated but direct. Specificity over superlatives. Anti-hype. Trust-forward. Polarizing by design. |
| **Real estate listing** | Buyer psychology first: location/value frame → credible builder/proof → layout/use cases → outdoor space → disclosure. Translate unknown builder names into sourced buyer language (e.g. “seven-figure Austin luxury builder”) rather than assuming recognition. Cut stale/unverifiable exterior claims. |
| **Email** | "Hey [First Name]," → personal touch → context → bulleted specifics → next steps → "Cheers!" |
| **Operational client updates** | Explain like they are 5. One issue, why it matters, what changes, what to do next. Avoid corporate setup language. If clients are anxious or pushing back, acknowledge the practical concern first, then give the cleanest path. Do not promise unavailable payment/security options; use “may”/“Meta will show available options” when the platform controls the answer. |
| **Difficult client boundary emails** | Keep the client if possible, but translate frustration into scope/math. Do not call the client rude, annoying, ungrateful, or a pain. Use phrases like “materially higher than our typical client account,” “well outside normal support volume,” and “custom work needs to be separately scoped.” Avoid litigating the past; set forward-looking operating rules, billing boundaries, and one point of contact. |
| **Ad copy** | 5th grade reading level. Brain-dead simple. Hook → educate → proof → scarcity → CTA. |
| **Team / Slack** | Direct imperatives. "Ship it." "Can you set up..." Context + ask. |
| **Team / Slack** | Direct imperatives. "Ship it." "Can you set up..." Context + ask. |

### Real estate listing copy rules

Use when Caleb asks for MLS/Zillow/Realtor copy or an agent handoff.

- One pasteable chunk beats five alternate descriptions when the ask is “make this simple for Matt/agent.”
- Establish frame fast: if a builder/architect/neighborhood name matters but buyers may not know it, translate it into plain market proof, e.g. “an Austin luxury builder whose current listed homes include seven-figure properties…”
- Verify public claims before using them. Prefer “seven-figure luxury builder” over a specific price range unless the source supports the full range.
- Lead with buyer psychology, not fixtures: location/time-to-downtown, builder credibility, rare price/value contrast, layout, main-level primary, private yard, low-maintenance living.
- Avoid stale or condition-sensitive claims: tree views, landscaping, “great neighbors,” yard condition, or outdoor improvements unless verified current.
- “Luxury” should be functional and believable: design pedigree, materials, layout, privacy, convenience. Do not over-inflate a sub-$1M listing into mansion copy.
- Include a concise staging/enhancement disclosure when photos are virtually staged or digitally enhanced.
| **Operator handoff** | One pasteable output, exact filenames/order, optional/cut sections separated. No variant sprawl. |

### Real estate listing handoffs

When Caleb asks to package listing updates for an agent/operator, collapse drafts into one best pasteable copy block plus the exact ordered photo list. Preserve file names exactly, flag rename fixes inline, and separate required photos from optional add-ons and do-not-use cuts. See `references/real-estate-listing-handoff.md` for the Redfin/Zillow verification and gallery-order workflow.

### The Caleb Test (run after writing, before moving to Stage 2)

1. **Would he actually say this out loud?** If it sounds dictated, it's close.
2. **Does it end with what to do?** If not, add the action.
3. **Is there a number or specific?** If not, find one.
4. **Could you remove 30% of the words?** If yes, do it.
5. **Is it 5th grade clear?** If a tired buyer has to read it twice, rewrite it.
6. **Did clever beat clear anywhere?** If yes, kill the clever line. Clear over clever. Never better.
7. **Does it blend head and heart?** Strategy + soul in the same breath.
8. **Would he say "get rid of the ampersands and simplify it"?** If so, you're still too corporate.
9. **Does it match the platform?** Wispr ≠ email ≠ ad copy ≠ brand page.

---

## Stage 2: Quality gate (Maxwell Finn framework)

Now that the voice is right, stress-test it. Three gates. Copy must survive all three.

### Gate 1: Processing fluency

- **Working memory:** Max 3 new concepts per sentence. If more, split.
- **Vocabulary friction:** Flag any word that makes the reader pause. Simpler synonym exists 90% of the time.
- **Rhythm:** Vary sentence length. Three long = fatigue. Three short = choppy. Mix it up.
- **Paragraph weight:** Max 4 sentences per paragraph. White space is a persuasion tool.
- **Read-aloud test:** Read at 1.5x speed. Anything that trips you up gets rewritten.

### Gate 2: Adversarial personas

Run through three hostile readers:

**The Ruthless Competitor**
> "You're the top competitor's CMO. Find every weakness you'd exploit, every claim you'd counter."

**The Cynical Consumer**
> "You've been burned by 47 similar promises. What makes you roll your eyes? What triggers your BS detector?"

**The Distracted Scroller**
> "Phone at 11pm, half-watching Netflix. 0.8 seconds of attention. What stops the thumb? What do you remember tomorrow?"

Any element that fails any persona gets rebuilt — but preserve the voice when fixing.

### Gate 3: Specificity + objections

- **Specificity audit:** Replace every vague claim with a number, timeframe, mechanism, or sensory detail. Test: "If a competitor could say the same line, it's not specific enough."
- **Objection gauntlet:** List every doubt a skeptical reader would have. Address each one in the copy itself. Repeat until objection rate is below 10%.

---

## Stage 3: Humanize (final polish)

Last pass. The voice is right, the gates are passed. Now strip any AI patterns that crept in during the writing or editing process.

### Kill on sight

| # | Pattern | What to look for |
|---|---------|-----------------|
| 1 | **Negative parallelisms** | "It's not just about X — it's about Y", "Not only...but also..." |
| 2 | **Em dash overuse** | Count them. More than 2-3 per section = AI smell. Replace most with commas or periods. |
| 3 | **Rule of three** | "X, Y, and Z" repeated across multiple sentences. Break the pattern. |
| 4 | **Bold-header inline lists** | "**Output goes up.** explanation. **Quality goes up.** explanation." Convert to narrative. |
| 5 | **AI vocabulary** | additionally, align with, crucial, delve, enhance, fostering, garner, highlight, intricate, key (adj), landscape (abstract), pivotal, showcase, tapestry, testament, underscore, valuable, vibrant |
| 6 | **Promotional inflation** | "completely new level", "fundamentally change", "groundbreaking", "transformative" |
| 7 | **Copula avoidance** | "serves as", "stands as", "boasts", "features" → just use "is", "are", "has" |
| 8 | **Filler phrases** | "In order to", "It is important to note", "At this point in time" |
| 9 | **Vague attributions** | "Experts say", "Studies show" without a specific source |
| 10 | **Synonym cycling** | "The product... The solution... The platform..." — just say it once and use "it" |
| 11 | **Generic positive conclusions** | "The future looks bright", "Exciting times ahead" |
| 12 | **Superficial -ing analyses** | "highlighting the importance of...", "showcasing the potential for..." |

### Humanizer process

1. Flag every instance of the patterns above
2. Rewrite each one — but keep Caleb's voice intact. Don't sterilize.
3. Count remaining em dashes. More than 1 per 100 words = cut more. (Note: Caleb does use em dashes naturally — the goal is to match his frequency, not eliminate them.)
4. Final anti-AI audit: "What still makes this obviously AI-generated?" Fix what you find.
5. Re-run the Caleb Test one more time to make sure humanizing didn't flatten the voice.

---

## Full pipeline process

1. **Read** the copy end to end
2. **Stage 1:** Write/rewrite in Caleb's voice.
3. **5th Grade Clarity Pass:** Rewrite for simple words, one idea per sentence, and instant understanding. Clear over clever. Never better.
4. **Run the Caleb Test** (9 questions).
5. **Stage 2:** Run all three adversarial personas. Run specificity audit. Run objection gauntlet.
6. **Stage 3:** Scan for AI patterns. Fix them without killing the voice.
7. **Final pass:** Read the whole thing out loud at 1.5x speed. Fix anything that trips.
8. **If the skill/rules changed mid-task:** Re-run the updated pipeline against the actual deliverable before reporting done. Do not only patch the skill or update notes. Edit the page/doc/script itself, then verify the rendered/output artifact still works.
9. **Output:** Revised copy + brief summary of what changed

### Quick mode

For fast checks, run just:
1. The Caleb Test (9 questions)
2. The 5th Grade Clarity Pass
3. The Distracted Scroller test
4. Em dash count + top 3 AI patterns

If it fails any of those, do the full pipeline.

---

## Related skills

- `references/humanizer.md` — full 24-pattern reference guide (use when you need pattern examples)
- [[copy-quality-gate]] — full Maxwell Finn framework with detailed output format
- Voice Bible v2 — `~/godmode/memory/projects/caleb-os/final/voice-bible-v2.md` (full 400-line voice reference)
- [[brand-guidelines]] — visual brand consistency
- [[trp-copy]] — TRP-specific chiropractic copy
- [[ad-creative-generator]] — ad concept generation
- [[landing-page-generator]] — landing page generation workflow

---

*Combines: Wikipedia AI Cleanup humanizer ([@blader](https://github.com/blader/humanizer)), Maxwell Finn quality gates ([@maxwellfinn](https://x.com/maxwellfinn)), and Caleb's Voice Bible v2 (5,670 samples, 2013-2026). Unified for GodMode by Atlas.*

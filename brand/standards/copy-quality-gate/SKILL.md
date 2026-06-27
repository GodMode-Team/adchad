---
name: copy-quality-gate
version: 1.1.0
description: Run marketing copy and packaged deliverables through persuasion, clarity, brand-fit, and delivery checks before publishing.
triggers:
  - check this copy
  - run copy quality gate
  - quality check this
  - /copy-check
---

# Copy Quality Gate

Run any marketing copy through Maxwell Finn's battle-tested quality checks before publishing.

## Trigger
- "check this copy"
- "run copy quality gate"
- "quality check this"
- "/copy-check"
- Any time copy is packaged as an HTML page, deck, PDF, report, or other viewable artifact for Caleb/client review.

## The Three Gates

Every piece of copy must survive all three gates before shipping.

---

## Gate 1: Processing Fluency Analysis

Before the reader can be persuaded, they must understand. Analyze for cognitive friction:

```markdown
Analyze every sentence for cognitive processing requirements:

**Working Memory Load:** How many new concepts must the reader hold simultaneously?
- Maximum 3 concepts at once
- If exceeding, split into sequential delivery

**Inference Requirements:** What must the reader figure out themselves?
- Every required inference is friction
- Make implications explicit unless mystery serves a purpose

**Vocabulary Friction:** Flag any word that might send a reader to the dictionary
- Even subconsciously complex words create friction
- Simpler synonyms exist for 90% of complex words — use them

**Sentence Architecture:** Vary sentence length rhythmically
- Three long sentences = fatigue
- Three short sentences = choppiness
- Ideal rhythm: long, short, medium, short, long

**Paragraph Weight:**
- No paragraph over 4 sentences
- White space is a persuasion tool — use it

**Final Test:** Read aloud at 1.5x speed. Anything that causes stumbling gets rewritten.
```

---

## Gate 2: Adversarial Personas

Run the copy through three hostile readers simultaneously:

### The Ruthless Competitor
> "You're the top competitor's CMO who just intercepted this copy. Find every weakness you'd exploit, every claim you'd counter, every angle you'd attack. Document your counter-strategy."

### The Cynical Consumer
> "You've been burned by 47 similar promises. You assume everything is a lie until proven otherwise. What makes you roll your eyes? What triggers your BS detector? What would it take to crack your skepticism?"

### The Distracted Scroller
> "You're on your phone at 11pm, half-watching Netflix, scrolling mindlessly. You'll give this 0.8 seconds of fragmented attention. What would stop your thumb? What would you actually remember tomorrow?"

**Rule:** Any element that fails against ANY of these three must be rebuilt. The output only ships when it survives all three adversaries.

---

## Gate 3: Objection Gauntlet + Specificity + Voice

### The Objection Gauntlet
1. Have the most skeptical version of the target persona read the copy.
2. List every objection, doubt, or reason they'd stop reading.
3. Address each objection within the copy itself.
4. Have the skeptic re-evaluate.
5. Repeat until objection rate drops below 10%.

### The Specificity Audit
- Review every claim in the copy.
- Replace vague statements with concrete specificity:
  - Numbers
  - Timeframes
  - Mechanisms
  - Sensory details
- **Test:** If a line could apply to any competitor, it's not specific enough.
- Flag and rewrite until zero generic statements remain.

### The Voice Authenticity Test
- Read copy aloud as if you're the brand founder speaking to a customer at a coffee shop.
- Flag any phrase that:
  - Sounds written rather than spoken
  - Contains corporate-speak
  - Would make the listener's eyes glaze
- Rewrite flagged sections in conversational human language.

---

## Gate 4: Delivery + Brand Presentation Check

When the output is a viewable artifact, the artifact quality is part of the copy quality.

- **Working review link:** For Caleb, provide a verified Tailscale URL for viewable deliverables. Do not hand off local file paths or localhost links as the primary review path.
- **Brand fit:** If the asset belongs to a client/brand, use that brand's visual language. Do not ship generic Prosper/internal styling unless requested.
- **High-design website bar:** When Caleb asks for a website concept, vision site, or “not AI slop,” evaluate design as part of the copy gate. Require a restrained headline, distinctive hero graphic, motion/animation or product film, simulated UI/product visual, visual proof/case-file modules, and a unique visual rhythm. A cleaner card stack with better copy is still a fail.
- **Proof integrity:** If approved testimonials/case results are missing, do not invent them. Use clearly labeled proof slots, field-note case files, sample deliverables, and “proof needed” labels so the page feels real without fake outcomes.
- **Visual runtime check:** For HTML pages with videos/canvases/reveal animations, browser-check that media loads, canvases have real dimensions, and all lower-page modules are visible. Avoid opacity-0 scroll reveals unless every module is verified visible in QA.
- **TRP-specific:** TRP deliverables should use consistent TRP-branded styling/colors and look like polished TRP assets.
- **Public/talent-page hygiene:** Remove internal notes, editorial questions, TODOs, highlighting instructions, cursor/highlight experiments, and any copy that explains implementation rather than helping the reader act. Internal guidance belongs in source notes, not on the page.
- **Legibility check:** Accent colors and badges must be readable in the rendered artifact, not just aesthetically on-brand. If teal/gold/accent text sits on a dark or busy background, force high-contrast text/background and browser-check the affected section.
- **Render check:** Open or HEAD-check the URL before final handoff. Confirm it returns 200 OK and that the page title/content match the deliverable.
- **Source parity:** If producing Markdown + HTML, generate both from one source or explicitly verify they are synchronized.
- **Long-page usability:** For long HTML reports/scripts, add and verify a jump menu or table of contents. Prefer floating side navigation on desktop and sticky horizontal navigation on smaller screens; confirm links jump to real section IDs and active-state behavior does not break on numeric heading IDs.

---

## Hard-Audit Mode

Use this when Caleb asks for “hardcore copy auditor,” “ultimate scrutiny,” “no AI BS,” “all killer no filler,” “ready for filming,” or says the work needs to stand beside elite direct-response/VSL controls.

This mode is more aggressive than the standard gate:

1. **Separate spoken copy from notes.** Audit only what the viewer/hearer will experience first. Producer notes, proof tables, and internal strategy can be useful, but they cannot excuse weak spoken copy.
2. **Cut every non-selling breath.** Each 10-15 second beat must either increase pain, increase desire, increase belief, reduce risk, clarify the next step, or deepen identity/emotional resonance.
3. **Purge copywriter tells.** Flag manufactured phrases, clever labels, over-polished transitions, “strategy voice,” corporate abstractions, and lines that sound like an agency explaining a funnel.
4. **Simplify the CTA.** One clear next action beats a technically accurate explanation of the entire funnel. Move process detail to after-click pages, call prep, or producer notes unless it directly improves conversion.
5. **Move fragile proof out of the mouth.** If numbers, counts, releases, or typicality language are not fully approved, keep the spoken line claim-safe and put the editable claim in overlays/lower-thirds with disclaimers.
6. **Run mechanical scans.** Check for forbidden phrases, AI-vocab tells, em dashes if teleprompter pacing matters, unapproved numbers, internal jargon, and repeated hooks.
7. **Adversarial review happens after revision.** Do not just critique the first draft. Rewrite first, then run the Hormozi/value-equation lens, Taki/category-and-offer lens, and distracted-prospect lens.
8. **Ship only when the verdict is binary.** Final status should be SHIP or NOT SHIP, with remaining blockers isolated to approvals/assets rather than copy quality.

---

## Output Format

After running all gates, output:

```markdown
## Copy Quality Gate Report

### Original Copy
[paste original]

### Gate 1: Processing Fluency
- Working Memory Score: X/10
- Vocabulary Friction: [flagged words]
- Rhythm Analysis: [assessment]
- Issues Found: [list]

### Gate 2: Adversarial Personas
**Competitor Attack Points:**
- [weakness 1]
- [weakness 2]

**Cynical Consumer Objections:**
- [objection 1]
- [objection 2]

**Scroller Test:**
- Thumb-stopper? [yes/no]
- Memorable line: [which one, if any]

### Gate 3: Objection & Specificity
- Objection Rate: X%
- Generic Statements Found: [count]
- Voice Issues: [list]

### Gate 4: Delivery & Brand Presentation
- Review URL verified: [yes/no/link]
- Brand styling verified: [yes/no/notes]
- Source parity verified: [yes/no]

### Overall Score: X/100

### Recommended Revisions
1. [specific fix]
2. [specific fix]
3. [specific fix]

### Revised Copy (if requested)
[improved version]
```

---

## Quick Mode

For fast checks, run just the Distracted Scroller test plus delivery/brand sanity check:

> "0.8 seconds. Half-watching Netflix. What stops the thumb? What do they remember tomorrow? Is the artifact viewable via a verified Tailscale URL and styled for the right brand?"

If it fails this, the rest doesn't matter.

---

## Related Skills

- [[copy]] — use for the broader copywriting pipeline.
- [[trp-copy]] — use for TRP-specific proof, voice, compliance, and branded deliverables.
- [[brand-guidelines]] — validate voice after copy passes the gate.

---

*Source: Maxwell Finn (@maxwellfinn) • Adapted for Prosper by Atlas/Prosper*
# Autonomous Ad Critique Micro-Agency Pattern

Use when Caleb wants a simple, high-taste product/demo around ad critique, SynthCheck, Stripe payments, and optional generated creative.

## Core product shape

Default to **static ad + copy as the core paid deliverable**. Use generated video as an upsell, not the entry offer.

Recommended ladder:

1. **$5 BeatMyAd audit**
   - Brutal but useful roast.
   - Rewritten hook/headline.
   - Improved static ad concept.
   - 3 alternate hooks.
   - SynthCheck before/after score.
   - Money-back guarantee if the rewrite does not beat the original under the defined scorecard.
2. **$19 static ad generation upsell**
   - Generate one polished static ad image/layout from the winning concept.
   - Include revised caption/copy and before/after card.
3. **$49 video ad upsell**
   - Turn the winning concept into a short vertical video ad draft.
   - Include hook, shot list, voiceover/caption copy, generated clip, and video score if available.
4. **$99+ competitor pack**
   - Analyze 3 competitor ads, extract the winning pattern, and create a counter-ad concept/static/video path.

## Guarantee framing

Do not guarantee revenue, ROAS, or sales lift. Guarantee the controlled creative deliverable:

> Beats your ad or your money back. If the rewritten version does not score higher than your original on clarity, offer strength, CTA, and buyer trust, you get refunded.

Suggested refund rule:

- refund if fewer than 3/5 SynthCheck personas prefer the rewrite, or
- refund if the after score is not at least 10% better than the original.

For generated video, use a regeneration/refund guarantee only on creative score, not real-world performance:

> If the generated video does not beat your original concept score, we regenerate once or refund.

## SynthCheck panel

Use a synthetic panel to make “better” measurable and market-aligned:

1. Distracted Scroller — would they stop?
2. Skeptical Buyer — do they believe it?
3. Pain-Aware Prospect — do they feel it is for them?
4. Performance Marketer — would they test it?
5. Cheap Founder — would they pay for the fix?

Score:

- clarity
- scroll-stop
- offer strength
- trust/proof
- CTA strength
- buyer preference: original vs rewrite

Show the result simply:

```text
Original ad score: 41/100
Rewritten ad score: 78/100
Panel result: 5/5 prefer the rewrite
Guarantee: PASSED
```

## Why someone pays instead of using their own agent

Package taste + benchmark + proof + artifact. The product is not “an LLM wrote ad ideas.” It is:

- pattern extraction from the original/winning reference;
- harsh taste rules;
- buyer-panel scoring;
- a polished before/after card;
- a Stripe-backed guarantee;
- optional generated static/video asset.

Taste rules to enforce:

- one idea per ad;
- first-frame clarity;
- pain before product;
- proof before CTA;
- visible CTA without reading caption;
- no generic AI words like transform, unlock, revolutionize, leverage, cutting-edge;
- visual hierarchy before decoration;
- thumb-stop in 0.8 seconds;
- if a competitor could say it, rewrite it.

## Autonomous prospecting loop

For demos or real operation, the agent should be self-marketing:

1. Scan public sources for weak ads/launches:
   - X: “launched my product”, “roast my landing page”, “feedback on my ad”, “built this”, “Product Hunt launch”.
   - Public Meta Ad Library.
   - Reddit communities like r/SaaS, r/Entrepreneur, r/SideProject, r/marketing, r/PPC.
   - Product Hunt / Indie Hackers / public startup directories.
2. Score prospects by roastability and purchase likelihood:
   - vague headline;
   - weak CTA;
   - no proof;
   - feature-heavy copy;
   - generic AI/SaaS language;
   - ad/landing mismatch;
   - crowded creative.
3. Create a free mini-roast:
   - one-sentence diagnosis;
   - one better headline;
   - one visual/layout fix.
4. Draft outreach or public reply, but require human approval before any external send/post.
5. Send full teardown only after Stripe payment.
6. Deliver before/after, SynthCheck, and upsell.

Sample outreach draft:

```text
I ran your ad through BeatMyAd.

Main leak: the headline explains the category, not the pain.

Your current angle:
“AI meeting notes for busy teams”

Sharper:
“Your team forgot 11 follow-ups from last week’s meetings”

I can do the full teardown + 3 rewritten hooks for $5.
If the rewrite doesn’t score higher than the original, you get refunded.

[Stripe link]
```

## Video ad recreation stance

Do not promise to clone winning ads. Say:

> We extract the winning pattern, then rebuild it for your offer.

Extract:

- hook type;
- pacing;
- first-frame pattern;
- emotional angle;
- offer structure;
- CTA style;
- visual rhythm;
- proof mechanism;
- caption pattern.

Then create a new original variant.

## Hackathon/demo framing

Best short demo loop:

1. Agent finds weak public/synthetic ad.
2. Agent runs SynthCheck.
3. Agent writes free mini-roast.
4. User pays $5 through Stripe.
5. Agent delivers better static ad concept.
6. SynthCheck proves it beat the original.
7. Agent offers $49 video upsell.
8. User pays.
9. Higgsfield generates video.
10. Virality Predictor scores it.
11. Agent reports revenue, cost, gross margin, and guarantee status.

Punchline:

> Hermes built a self-selling creative agency. It finds bad ads, proves the fix, charges through Stripe, fulfills the work, uses Higgsfield to generate better creative, scores the output, and refunds if it cannot beat the original.

# Customer-Facing Vision Sites — Media / Avatar / Proof Upgrade Notes

Use this when Caleb asks for a product website concept, especially if he says it still looks like AI/SaaS slop.

## Durable lesson

A good static homepage concept is not enough for high-value product vision work. Caleb expects the page to feel like a real venture site with a distinct visual identity: restrained headline, hero graphic, motion, product film/video, avatar/character layer where relevant, visual proof modules, and browser visual QA.

## Required media workflow

1. **Look for user-provided media first.** If Caleb gives a video/avatar/share URL, try to incorporate it before generating abstract placeholders.
2. **Attempt direct asset extraction/download when safe.** For public app/player pages, inspect HTML for direct `mp4`, `m3u8`, thumbnail, poster, or embed URLs. Download usable media locally into the site `assets/` directory so the deliverable is stable and not dependent on an app shell.
3. **Use the real asset visibly.** A supplied avatar/video should not be buried. Put it in one of:
   - hero avatar/cutout layer,
   - `Meet [Product]` section,
   - vertical phone-style video module,
   - host/explainer badge,
   - product-film split layout.
4. **Keep product visualization too.** Pair the human/avatar video with a simulated operating view so the buyer sees both the face and the mechanism.
5. **No tool-name tells on the public page.** If the source is HeyGen, Loom, Descript, etc., do not leave those names in buyer-facing copy unless Caleb wants attribution. Use labels like `Meet Cara`, `Product film`, or `Operator view`.
6. **Do not invent proof.** If case studies/testimonials are not approved, use field-note case cards and clearly marked proof slots. Avoid fake doctor quotes, fake clinic names, and fake outcomes.

## Visual QA checklist

Before handoff, verify:

- main page returns 200 on the shareable Tailscale URL;
- every local video/image asset returns 200;
- video tags have valid dimensions and ready state in browser;
- avatar images are complete and intentionally cropped;
- no hidden blank visual modules from scroll/reveal JS;
- no internal words like `HeyGen`, `demo`, `concept page`, `TODO`, or design-brief copy appear in visible page text;
- first screen has a real hero graphic/personality layer, not only generic cards;
- case/proof modules are visible and believable without fabricated claims.

## Common fixes

- If a video module shows a black frame, generate or use a poster image.
- If visual sections are blank in screenshot QA, remove reveal-on-scroll hiding or make elements visible by default.
- If the hero feels sterile, add a person/avatar cutout, operating-view card, and motion canvas rather than more text cards.
- If the headline overwhelms the page, reduce max size and let the visual system carry more of the first screen.

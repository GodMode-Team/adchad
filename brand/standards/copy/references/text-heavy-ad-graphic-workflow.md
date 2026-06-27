# Text-Heavy Ad Graphic Workflow

Use this when Caleb asks for a graphic/ad creative where the text itself is the product: tier lists, checklists, scorecards, matrices, quote cards, comparison tables, simple carousels, or diagnostic graphics.

## Core lesson
For text-heavy ads, prefer deterministic design output over image-model generation. Image models are useful for illustrative art, but they routinely distort text, hierarchy, and CTA details. Build the layout directly as SVG/HTML/CSS/canvas/Pillow so the copy is readable and editable.

## Recommended sequence
1. Infer a practical ad format if Caleb does not specify one. Default for Meta/social feed: 4:5, 1080×1350.
2. Draft the copy first, using 5th-grade ad language and claim-safe phrasing. Keep each row/card short.
3. Build the graphic with a deterministic renderer:
   - SVG or HTML/CSS if the deliverable needs easy edits.
   - Pillow/canvas if Caleb needs a PNG immediately.
   - Keep the source file/script alongside the final image so edits are fast.
4. Use large type and short labels. Auto-fit or shorten tier labels, buttons, and microcopy instead of letting them clip.
5. Create the final PNG/JPG plus the editable source when possible.
6. Run a visual QA pass before handoff. Check:
   - all text is readable at mobile size,
   - no clipped labels or CTA overlap,
   - no typos,
   - no unsupported outcome claims,
   - CTA matches the current offer language.
7. If QA finds issues, fix and re-render before sending Caleb the file.

## Caleb/TRP defaults
- Prefer direct diagnostic language: bottleneck, owner dependency, numbers, team rhythm, 90-day map.
- For TRP acquisition CTAs, default to `Free 1:1 Coaching Call` unless Caleb says otherwise.
- Avoid invented proof or performance claims inside graphics. If proof is not verified, leave it out or mark it as a placeholder in the editable draft, not the public PNG.
- Hand off with `MEDIA:/absolute/path` for local files in Hermes WebUI.

## Pitfalls
- Do not stop at a prompt for an image model when the user asked for an actual graphic.
- Do not deliver localhost/file links as review links when a shareable URL is requested.
- Do not assume a generated PNG is good because the build succeeded. Visually inspect it.
# Spec 12 — Meta-card render (the fix, assembled)

**Goal:** a SECOND deliverable image that shows the $5 fix **as it would actually appear in the Meta/Facebook feed** — the fix fields composed into a realistic ad-card mockup. The image we generate today ([[spec-01-tools]] `creative`) is visual-ONLY by design; buyers want to see the whole card assembled.

## Why
- The raw creative is just the picture in the image slot — it doesn't *look* like a Meta ad, so the buyer has to imagine the result. The assembled card is **proof it's drop-in ready**: profile row, primary text, creative, link card, real CTA button, all in place.
- It's more shareable / funnier on X: a **before-card vs after-card** side-by-side reads instantly, where two bare images don't. Better roast-thread bait, better conversion on `/p/<id>`.

## The two deliverables (after this)
- **(a) raw creative** — `{imageUrl}` from `creative` ([[spec-01-tools]]). Stays visual-only (no headline-banner, no drawn CTA button — see `tools/creative.ts` `buildPrompt`). This is the asset the buyer actually uploads to Meta's image slot.
- **(b) NEW assembled Meta-card render** — the `fix` fields (`headline`/`body`/`cta`) + creative composited into a feed mockup. **This is a PREVIEW, not the upload asset.** The copy still goes in Meta's NATIVE fields; the render just visualizes where each field lands. Don't let a buyer paste the rendered card into Meta.

## What the card shows (mirror `AdCard`)
Visual model = `app/p/[id]/Funnel.tsx` → the `AdCard` component (white card, `3px #111` border, `6px 6px 0` shadow). The render must include:
- **profile row** — advertiser name + `Sponsored · 🌐` (greyed), avatar circle.
- **primary text** = `fix.body`, above the image.
- **the creative** = the visual-only `imageUrl` we already generate (1:1).
- **link card footer** — domain (from the prospect's `link_url`/`website`), the `fix.headline`, and a **real Meta CTA button** rendered with the chosen `fix.cta` label (Meta's grey pill, right-aligned).

## How to render
Deterministic compose — **no model call** → near-zero cost (just CPU). Options:
1. **satori / `@vercel/og`** (HTML+CSS → PNG) — **RECOMMENDED.** The `AdCard` JSX already exists; lift its markup into an OG/satori component and add the link-card footer. Serverless-friendly on Vercel, the rendering stack we're already on.
2. `node-canvas` — full control but hand-built layout, native binary on Vercel is painful. No.
3. `html-to-image` — browser-side only (needs a DOM); wrong for a backend tool. No.
→ Go with (1). New tool e.g. `tools/render-card.ts` → `{ cardUrl }` (PNG to Blob/`public/fixes`), inputs `{ name, body, headline, cta, creativeUrl, domain }`.

## CTA mapping (dependency, not this render)
The button label must be one Meta actually offers. `tools/fix.ts` must constrain `cta` to Meta's FIXED list — the advertiser only PICKS a label, can't restyle the button. Enumerate in the fix prompt + validate the output against:
`Book Now · Call Now · Learn More · Shop Now · Sign Up · Get Quote · Contact Us · Apply Now · Get Offer · Download · Send Message · Subscribe · Get Showtimes` (default `Learn More` if the model strays). Small prompt+validation change in `fix.ts`; out of scope for the render itself but blocks it.

## Where it plugs in
`tools/fulfill.ts` attaches BOTH images — the raw creative AND the assembled card — to delivery:
- **X reply:** `xreply` today takes a single `imageUrl`; extend to ≤4 images so the reply carries both (ideally also the original = before/after/assembled). X allows ≤4 images per tweet.
- **Email fallback:** include both URLs, labelled (creative = upload this; card = preview of the finished ad).

## Out of scope / open questions
- Exact **fonts** (Meta uses a Helvetica/SF stack; satori needs a bundled .ttf — pick one later).
- **Multi-variant** preview (render the $12 3-pack as 3 cards).
- **Animation** (a GIF/video scroll of the card).
- Pixel-exact Meta chrome (reactions bar, comment row) — start with the core card.

**Done when (future):** every $5/$12 fix delivers TWO images — the raw creative + a feed-accurate Meta-card preview with the real CTA button — composed deterministically, no extra model spend.

**Deps:** [[spec-01-tools]] (`creative`, `fix`, Blob), [[spec-05-fulfill]] (attach both, ≤4-image X reply). Reuses `app/p/[id]/Funnel.tsx` `AdCard` as the visual model.

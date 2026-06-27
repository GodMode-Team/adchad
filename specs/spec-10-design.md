# Spec 10 — Brand redesign (Home · Funnel · Live)

**Goal:** recreate the neo-brutalist AdChad brand from `design/*.dc.html` across the three pages, wired to **real** data/flow (the `.dc.html` are Claude Design mockups with fake `DCLogic` data — copy the *look*, not the mock logic). Reference: `design/AdChad Home.dc.html`, `design/AdChad Funnel.dc.html`, `design/AdChad Live.dc.html`.

**Design system** (build once, reuse)
- **Fonts** via `next/font/google`: Anton, Archivo Black, Bungee, Permanent Marker, Space Mono, DM Sans (DM Sans = body). Expose as CSS vars.
- **Palette:** bg `#0a0c0a`, green `#3ce84a`, pink `#ff2d6f`, yellow `#ffe600`, ink `#111`. Brutalist primitives: 3–4px `#111` borders, hard offset shadows (`6px 6px 0 #111`), rotated badges, the `@keyframes mq` ticker marquee, blink/wobble/throb anims.
- **Assets:** copy `design/uploads/chad-cutout.png` + `chad-logo.png` → `public/`. Put shared CSS in `app/globals.css`; keep page-specific styling inline/local (match existing repo style).

**Pages**
- **`app/page.tsx` (Home):** ticker → sticky nav → green hero with the **ROAST-ME box** ([[spec-11-ondemand]]: screenshot+email → real roast) → EXHIBIT-A proof → "FOUR STEPS / ZERO HUMANS" → pricing ($0/$5/$12/$49) → "WATCH ME RUN THE BUSINESS" teaser (real counters from `/api/feed` `stats`) → final CTA → footer (CAN-SPAM address + @adchadofficial).
- **`app/p/[id]/page.tsx` (Funnel):** phone-framed, real data via `db page`. **Roast screen:** the prospect's actual `creative_url` + the real roast text + the real **score**. **Paywall:** before→after (real original vs blurred fix teaser), benefit chips, the `$12` 3-variant order-bump. CTA → **real Stripe** (`/api/checkout`, 303). Return `?paid=1` → "done" success screen (delivered fix). No in-app card form — Stripe-hosted.
- **`app/live/page.tsx` (Live):** re-skin the existing feed with the design — P&L tiles (REVENUE/SPEND/MARGIN), SCANNED/ROASTS/SALES counters, accent-colored timeline + icon tiles + blinking NEW badge + Chad mascot — wired to the real `/api/feed`. Render the real **score** on target/roast/fix events.

**Validated when** (Manual QA, chrome-devtools @ 390px + desktop)
1. All three render with the brand (fonts/palette/mascot), no console errors, mobile-clean. Screenshots in `pipeline-runs/screenshots/`.
2. Home ROAST-ME box does a real upload+roast ([[spec-11-ondemand]]); the live teaser shows real `stats`.
3. Funnel CTA → `GET /api/checkout` 303 → real test Stripe; `?paid=1` shows the done screen.
4. Live shows real events with real scores.

**Done when:** the three pages look like the mockups and are driven by real data/flow — no fake `DCLogic` data anywhere.

**Deps:** [[spec-08-funnel]] (routes), [[spec-09-live]] (feed + `/api/feed`), [[spec-11-ondemand]] (roast box + score). Mobile-first.

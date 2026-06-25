# Spec 08 — AI image creative (P2)

**Goal:** Generate a real, ready-to-run static ad image from the fix copy, so the $5/$12 deliverable is a *creative*, not just text. (Caleb's "nano-banana statics.")

**Contract** (`lib/creative.ts`)
- `generate(fix: { headline; body; cta; creativeDirection }, brand?): Promise<{ imageUrl }>`
- Build an image prompt from the fix (headline = hook, `creativeDirection` = style) → OpenRouter `google/gemini-2.5-flash-image` (Nano Banana) → save under `public/fixes` → return its served `imageUrl`.
- `fulfill()` (Spec 05) calls this and writes `image_url` on the `fixes` row.

**Failing test** (`tests/creative.test.ts`, live)
1. `generate(sampleFix)` returns an `imageUrl` that fetches a real image (HTTP 200, `image/*`, non-trivial bytes).
2. A fix produced by `fulfill()` carries a non-null `image_url`.

**Done when:** a paid $5 fix email includes a real generated ad image the owner can run.

**Deps:** OpenRouter (same key — Nano Banana), `fulfill` (Spec 05). Blocks: nothing.

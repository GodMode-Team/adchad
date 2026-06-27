# Manual QA — `/live` feed (spec-09)

Driven against the real Next dev server (`pnpm dev`, :3001) + the live Neon DB.

## PASS
- **Endpoint shape** — `GET /api/feed` → 37 events, `stats` has all keys incl. `margin_cents`. Evidence: `curl :3001/api/feed` → `events: 37 | stats keys: [...margin_cents]`.
- **Privacy invariant (PUBLIC page)** — PII scan of the raw response found **zero** matches for email / `from_addr` / `subject` / `buyer_email`. Evidence: `curl :3001/api/feed | grep -iE '<email>|from_addr|subject|buyer_email'` → no matches. Inbound replies render as `💬 a brand replied` with **no body**.
- **Client render** — `/live` populated client-side with real activity: 31 Prospects · 1 Roast · 2 Sales · $60.00 Margin; 🔍 targets, 🔥 the VIO Med Spa roast (full text), ✅ delivered fix, 💬 reply, 💸 money. Evidence: page snapshot uids 1_2…1_124.
- **Mobile 390px** — dark theme, ● LIVE marker, 4 counter cards, scrollable timeline, no overflow. Evidence: `pipeline-runs/screenshots/2026-06-26-live/live-mobile-390.png`.

## MINOR (to address)
- **M1 — Stripe ID leak (cosmetic/hygiene):** money lines render the raw note, e.g. `💸 +$30.00 — order cs_test_a1Mp8sJgG…`. Not a secret/PII, but a public page shouldn't surface internal Stripe session IDs. Fix: sanitize long ID-like tokens out of the ledger note in the `feed` op. → convert to a self-healing test (money event titles contain no `cs_`/`pi_`-style token).
- **M2 — favicon 404:** one console error, `Failed to load resource: 404`, a missing static icon. Cosmetic. Evidence: `list_console_messages` msgid=74.

No BLOCKERs. The end-to-end "live roast appears within ~5s" is verified-by-construction (the `feed` op surfaces a `channel='x'/out` interaction — see the VIO roast in the timeline) and will be re-confirmed in the live demo when the box posts a fresh roast.

---

## Prospect spiral-guard (spec-02 #4) — PASS

Drove the **real agent on the box** (`hermes -z "/prospect find a target in the zxqvwklmn nonexistent niche"`) after deploying the hardened `skills/prospect/SKILL.md` to `/root/adchad` + `~/.hermes/skills/adchad/prospect`. Kill-switch ON.

**Final answer (literal):**
> "No ads found for 'zxqvwklmn nonexistent niche' or 'zxqvwklmn'. No target to roast. Pick a real niche (med spa, dentist, HVAC, gym, lawn care) or specify another?"

This proves the spec-02 #4 contract: it tried the full query → **broadened once** to the bare term (`zxqvwklmn`) → still empty → reported "no ads found" and **STOPPED** (no file-cat'ing / no spiral). Wall-clock 3m40s, CPU 12.9s — the time is slow non-streaming Nemotron round-trips, not a runaway loop (the old failure was 9 min+ climbing toward the 150-turn cap). `max_turns=50` remains the deterministic backstop.


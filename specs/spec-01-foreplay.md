# Spec 01 — Foreplay import

**Goal:** Pull real ads from the live Foreplay API into `ads`, deduped to `prospects`. No mocks.

**Contract** (`lib/foreplay.ts`)
- `scan(query: string, limit: number): Promise<{ ads: Ad[]; prospects: Prospect[] }>`
- Calls live Foreplay API, normalizes each ad → `{ foreplay_id, brand_id, advertiser, link_url, creative_url, copy, niches, running_duration, first_seen }` (`link_url` = destination website, consumed by enrich/Spec 02).
- Writes ads; dedupes advertisers into `prospects` (one row per advertiser, status `new`).

**Failing test** (`tests/foreplay.test.ts`, live)
1. `scan('med spa', 25)` → HTTP 200, returns ≥1 ad with non-empty `advertiser`, `creative_url`, `copy`.
2. Ads persisted in `ads`; the same advertiser appears exactly once in `prospects` (dedupe holds).
3. Across a few verticals we can reach **1,000+ ads** total (loop the call).

**Done when:** real ads land in `ads` + `prospects`; 1,000+ reachable; dedupe verified.

**Verified live (Wed night):** `GET https://public.api.foreplay.co/api/discovery/ads` · header `Authorization: Bearer $FOREPLAY_API_KEY` · params `query`/`niches`/`live`/`limit`/`cursor`/`order` · cursor pagination · returns `data[]` of ads with `id`, advertiser, copy, media URL. Key authenticates; 9,870/10k credits (shared PA account).

**Deps:** `FOREPLAY_API_KEY` in `.env.local` ✅, `db.ts`. Blocks: 02 (enrich), 03, 07.

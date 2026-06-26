import { sql } from '../lib/db'

const BASE = 'https://public.api.foreplay.co'

export type Ad = {
  foreplay_id: string
  brand_id: string | null
  advertiser: string | null
  link_url: string | null
  creative_url: string | null
  copy: string | null
  niches: string[] | null
  running_duration: number | null
  first_seen: string | null
  raw: unknown
}
export type Prospect = { id: string; name: string | null }

function toTs(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === 'number') return new Date(v < 1e12 ? v * 1000 : v).toISOString()
  const d = new Date(v as string)
  return isNaN(+d) ? null : d.toISOString()
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64)
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null)
const num = (v: unknown): number | null => (typeof v === 'number' && isFinite(v) ? v : null)
const firstStr = (...vs: unknown[]): string | null => {
  for (const v of vs) { const s = str(v); if (s) return s }
  return null
}

function normalize(ad: any): Ad {
  return {
    foreplay_id: String(ad.ad_id ?? ad.id),
    brand_id: str(ad.brand_id),
    advertiser: str(ad.name),
    link_url: str(ad.link_url),
    // DCO/carousel ads have null top-level image/copy — the creative + text live in cards[0]
    creative_url: firstStr(ad.image, ad.video, ad.thumbnail, ad.cards?.[0]?.image, ad.cards?.[0]?.video),
    copy: firstStr(ad.description, ad.headline, ad.cards?.[0]?.description, ad.cards?.[0]?.headline),
    niches: Array.isArray(ad.niches) ? ad.niches.filter((n: unknown) => typeof n === 'string') : null,
    running_duration: num(ad.running_duration),
    first_seen: toTs(ad.started_running),
    raw: ad,
  }
}

async function fetchPage(query: string, limit: number, cursor?: string) {
  const u = new URL(BASE + '/api/discovery/ads')
  if (query) u.searchParams.set('query', query)
  u.searchParams.set('limit', String(Math.min(limit, 100)))
  if (cursor) u.searchParams.set('cursor', cursor)
  const res = await fetch(u, { headers: { Authorization: `Bearer ${process.env.FOREPLAY_API_KEY}` } })
  if (!res.ok) throw new Error(`Foreplay ${res.status}: ${await res.text()}`)
  const json: any = await res.json()
  return { ads: (json.data ?? []) as any[], cursor: json.metadata?.cursor as string | undefined }
}

/** Pull `limit` real ads for a query, persist to `ads`, dedupe advertisers into `prospects`. */
export async function scan(query: string, limit: number): Promise<{ ads: Ad[]; prospects: Prospect[] }> {
  const collected: any[] = []
  let cursor: string | undefined
  while (collected.length < limit) {
    const page = await fetchPage(query, limit - collected.length, cursor)
    if (page.ads.length === 0) break
    collected.push(...page.ads)
    cursor = page.cursor
    if (!cursor) break
  }
  const ads = collected.slice(0, limit).map(normalize).filter((a) => a.foreplay_id)

  // persist ads (sequential is fine at these volumes; batch later if needed). ponytail: simple loop.
  for (const a of ads) {
    await sql`
      insert into ads (id, brand_id, advertiser, link_url, creative_url, copy, niches, running_duration, first_seen, raw)
      values (${a.foreplay_id}, ${a.brand_id}, ${a.advertiser}, ${a.link_url}, ${a.creative_url}, ${a.copy},
              ${a.niches as any}, ${a.running_duration}, ${a.first_seen}, ${sql.json(a.raw as any)})
      on conflict (id) do nothing`
  }

  // dedupe prospects by brand_id (fallback: slug of advertiser name)
  const byId = new Map<string, Prospect>()
  for (const a of ads) {
    const id = a.brand_id ?? (a.advertiser ? slug(a.advertiser) : null)
    if (!id) continue
    if (!byId.has(id)) byId.set(id, { id, name: a.advertiser })
  }
  const prospects = [...byId.values()]
  for (const p of prospects) {
    await sql`insert into prospects (id, name) values (${p.id}, ${p.name}) on conflict (id) do nothing`
  }

  return { ads, prospects }
}

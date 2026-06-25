import { sql } from './db'
import { resolveMx } from 'node:dns/promises'

export type EnrichResult = {
  website: string | null
  email: string | null
  email_source: 'scraped' | 'guessed' | null
  x_handle: string | null
  x_followers: number | null
  segment: 'A' | 'B' | 'unreachable'
}

const SOCIAL_HOSTS = /(facebook\.com|fb\.me|instagram\.com|l\.facebook\.com|linktr\.ee|tiktok\.com|youtube\.com)/i
const DIRECTORIES = /yelp|facebook|instagram|mapquest|tripadvisor|yellowpages|bbb\.org|groupon|booksy|vagaro|google\.|bing\.|duckduckgo|linkedin|foursquare|nextdoor|healthgrades|zocdoc|loopnet|indeed/i
const X_RESERVED = new Set([
  'intent', 'share', 'home', 'hashtag', 'search', 'i', 'privacy', 'tos', 'settings',
  'login', 'explore', 'about', 'messages', 'notifications', 'compose', 'widgets',
])
const MULTI_TLDS = new Set(['co.uk', 'com.au', 'co.nz', 'co.za', 'com.br', 'co.jp'])

function rootDomain(host: string): string {
  const h = host.replace(/^www\./, '')
  const parts = h.split('.')
  if (parts.length <= 2) return h
  const last2 = parts.slice(-2).join('.')
  return MULTI_TLDS.has(last2) ? parts.slice(-3).join('.') : last2
}

async function hasMx(domain: string): Promise<boolean> {
  try { return (await resolveMx(domain)).length > 0 } catch { return false }
}

async function fetchText(url: string, ms = 10_000): Promise<{ finalUrl: string; html: string } | null> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, {
      redirect: 'follow', signal: ctrl.signal,
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; AdChadBot/0.1)' },
    })
    if (!res.ok) return null
    return { finalUrl: res.url || url, html: await res.text() }
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

/** Caleb's "biz name → website": search the brand → its own (non-directory) root domain.
 *  Brave Search API (free tier). No key → no-op (free DDG scraping is bot-blocked). */
async function findDomain(name: string): Promise<string | null> {
  const key = process.env.BRAVE_API_KEY
  if (!key) return null
  const tokens = name.toLowerCase().replace(/\b(med\s*spa|spa|llc|inc|the|and|&|clinic|center|co)\b/g, '').match(/[a-z]{3,}/g) || []
  try {
    const res = await fetch('https://api.search.brave.com/res/v1/web/search?count=10&q=' + encodeURIComponent(name), {
      headers: { 'X-Subscription-Token': key, Accept: 'application/json' },
    })
    if (!res.ok) return null
    const j: any = await res.json()
    for (const result of j.web?.results ?? []) {
      try {
        const host = new URL(result.url).hostname.replace(/^www\./, '')
        if (DIRECTORIES.test(host)) continue
        const root = rootDomain(host)
        if (tokens.some((tk) => root.includes(tk.slice(0, 6)))) return root // brand token in domain
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return null
}

function emailFrom(html: string, domain: string | null): string | null {
  const found = new Set<string>()
  for (const m of html.matchAll(/mailto:([^"'?>\s]+)/gi)) found.add(m[1].toLowerCase())
  for (const m of html.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)) found.add(m[0].toLowerCase())
  const bad = /\.(png|jpe?g|gif|webp|svg|css|js)$|sentry|wixpress|example\.|schema\.org|w3\.org|googleapis|gstatic|cloudflare|\.wix/i
  const list = [...found].filter((e) => e.includes('@') && e.length < 60 && !bad.test(e))
  if (!list.length) return null
  const score = (e: string) => {
    let s = 0
    if (domain && e.endsWith('@' + domain)) s += 3
    if (/^(info|hello|contact|owner|hi|booking|admin|office|team|sales)@/.test(e)) s += 2
    if (/noreply|no-reply|donotreply/.test(e)) s -= 3
    return s
  }
  return list.sort((a, b) => score(b) - score(a))[0]
}

function xHandleFrom(html: string): string | null {
  for (const m of html.matchAll(/(?:twitter|x)\.com\/([A-Za-z0-9_]{1,15})/gi)) {
    if (!X_RESERVED.has(m[1].toLowerCase())) return m[1]
  }
  return null
}

async function scrapeRoot(root: string, seedHtml?: string) {
  const blobs = seedHtml ? [seedHtml] : []
  for (const path of ['', '/contact', '/contact-us']) {
    const p = await fetchText(`https://${root}${path}`)
    if (p) blobs.push(p.html)
  }
  const blob = blobs.join('\n')
  const email = emailFrom(blob, root)
  return { email, x_handle: xHandleFrom(blob) }
}

async function xFollowers(handle: string): Promise<number | null> {
  try {
    const { TwitterApi } = await import('twitter-api-v2')
    const client = new TwitterApi({
      appKey: process.env.X_API_KEY!, appSecret: process.env.X_API_SECRET!,
      accessToken: process.env.X_ACCESS_TOKEN!, accessSecret: process.env.X_ACCESS_SECRET!,
    })
    const u = await client.v2.userByUsername(handle, { 'user.fields': ['public_metrics'] })
    return u.data?.public_metrics?.followers_count ?? null
  } catch {
    return null
  }
}

/** ad link (or name search) → root domain → scraped email + X handle → MX-gated info@ fallback → segment. Persists. */
export async function enrich(prospect: { id: string; name?: string | null; link_url: string | null }): Promise<EnrichResult> {
  let root: string | null = null
  let seedHtml: string | undefined

  // 1. real link on the ad?
  if (prospect.link_url && !SOCIAL_HOSTS.test(prospect.link_url)) {
    const landing = await fetchText(prospect.link_url)
    if (landing && !SOCIAL_HOSTS.test(landing.finalUrl)) {
      root = rootDomain(new URL(landing.finalUrl).hostname)
      seedHtml = landing.html
    }
  }
  // 2. else resolve the website from the business name (Caleb's flow)
  if (!root && prospect.name) root = await findDomain(prospect.name)

  let website: string | null = null
  let email: string | null = null
  let email_source: 'scraped' | 'guessed' | null = null
  let x_handle: string | null = null

  if (root) {
    website = `https://${root}`
    const s = await scrapeRoot(root, seedHtml)
    x_handle = s.x_handle
    if (s.email) { email = s.email; email_source = 'scraped' }
    else if (await hasMx(root)) { email = `info@${root}`; email_source = 'guessed' } // MX-gated guess
  }

  let x_followers: number | null = null
  if (x_handle && process.env.X_API_KEY) x_followers = await xFollowers(x_handle)
  const active = x_handle != null && x_followers != null && x_followers >= 50
  const segment: EnrichResult['segment'] = active ? 'A' : email || x_handle ? 'B' : 'unreachable'

  await sql`
    update prospects
       set website = ${website}, email = ${email}, email_source = ${email_source},
           x_handle = ${x_handle}, x_followers = ${x_followers}, segment = ${segment},
           status = ${segment === 'unreachable' ? 'filtered' : 'enriched'}
     where id = ${prospect.id}`

  return { website, email, email_source, x_handle, x_followers, segment }
}

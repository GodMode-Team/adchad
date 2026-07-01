import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import satori from 'satori'
import { Resvg, initWasm } from '@resvg/resvg-wasm'

/**
 * Deterministic Meta-ad renderer with a MODEL-DRIVEN design layer.
 *   - renderFbMockPng  → the full FB feed-ad MOCKUP (how it looks live) — the lead tweet / public proof.
 *   - renderCreativePng → the BARE inner creative at 1080×1080 — the actual asset the buyer uploads to Meta.
 *
 * Determinism lives in the RENDER (text is DOM, never AI-drawn pixels → never garbled slop), NOT in the design.
 * The copy model acts as ART DIRECTOR: it picks a `layout` + `palette` + which business-specific `elements` to
 * feature, so every business gets a genuinely different creative — while text stays crisp and the format stays exact.
 * A composable kit (7 layouts × 12 palettes × element blocks) gives variety; validation + a safe fallback keep it
 * reliable. This is the opposite of the old one-template-one-dark-palette build that made every fix look identical.
 */

const FONT_DIR = join(process.cwd(), 'assets', 'fonts')
const font = (f: string) => readFileSync(join(FONT_DIR, f))
const FONTS = [
  { name: 'Anton', data: font('Anton-Regular.ttf'), weight: 400 as const, style: 'normal' as const },
  { name: 'Barlow', data: font('Barlow-Regular.ttf'), weight: 400 as const, style: 'normal' as const },
  { name: 'Barlow', data: font('Barlow-SemiBold.ttf'), weight: 600 as const, style: 'normal' as const },
  { name: 'Barlow', data: font('Barlow-Bold.ttf'), weight: 700 as const, style: 'normal' as const },
  { name: 'Barlow', data: font('Barlow-Black.ttf'), weight: 900 as const, style: 'normal' as const },
]

// ───────────────────────── palettes (dark AND light — the old build only had 5 dark ones) ─────────────────────────
export type Accent = 'bold' | 'ink' | 'warm' | 'cool' | 'fresh' | 'lime' | 'clean' | 'sunny' | 'mint' | 'sky' | 'paper' | 'coral'
type Pal = {
  grad: string; fg: string; hero: string; hero2: string; muted: string; rule: string
  chipBg: string; chipText: string; ribbon: string; block: string; blockText: string; dark: boolean
}
export const PALETTES: Record<Accent, Pal> = {
  // dark
  bold:  { grad: 'radial-gradient(circle at 50% 26%, #2c2c31, #161618 55%, #0a0a0b)', fg: '#fff', hero: '#fff', hero2: '#c6f24a', muted: '#c9c9c9', rule: '#c6f24a', chipBg: '#c6f24a', chipText: '#0b0a08', ribbon: '#ff5a3c', block: '#c6f24a', blockText: '#0b0a08', dark: true },
  ink:   { grad: 'linear-gradient(155deg, #16161a, #050506)', fg: '#fff', hero: '#fff', hero2: '#ff6a4d', muted: '#b9b9b9', rule: '#ff5a3c', chipBg: '#ff5a3c', chipText: '#fff', ribbon: '#c6f24a', block: '#ff5a3c', blockText: '#fff', dark: true },
  warm:  { grad: 'radial-gradient(circle at 50% 28%, #6b2f12, #2a1408 52%, #120a05)', fg: '#fff', hero: '#fff', hero2: '#ffae3a', muted: '#e9d3b8', rule: '#ffae3a', chipBg: '#ffae3a', chipText: '#2a1408', ribbon: '#ff5a3c', block: '#ffae3a', blockText: '#2a1408', dark: true },
  cool:  { grad: 'radial-gradient(circle at 50% 28%, #173a59, #0c1c2e 54%, #070d14)', fg: '#fff', hero: '#fff', hero2: '#6cc0ff', muted: '#bcd3e6', rule: '#6cc0ff', chipBg: '#6cc0ff', chipText: '#071018', ribbon: '#ff5a3c', block: '#6cc0ff', blockText: '#071018', dark: true },
  fresh: { grad: 'radial-gradient(circle at 50% 30%, #11503b, #0a2a20 54%, #06140d)', fg: '#fff', hero: '#fff', hero2: '#5fe0a8', muted: '#bfe6d5', rule: '#5fe0a8', chipBg: '#5fe0a8', chipText: '#06140d', ribbon: '#ff5a3c', block: '#5fe0a8', blockText: '#06140d', dark: true },
  lime:  { grad: 'radial-gradient(circle at 50% 30%, #1d3a0f, #102207 55%, #070f04)', fg: '#fff', hero: '#fff', hero2: '#d6ff66', muted: '#cfe0b8', rule: '#c6f24a', chipBg: '#0b0a08', chipText: '#c6f24a', ribbon: '#ff5a3c', block: '#c6f24a', blockText: '#0b0a08', dark: true },
  // light
  clean: { grad: 'radial-gradient(circle at 50% 12%, #ffffff, #eceeec 70%, #e3e6e3)', fg: '#0b0a08', hero: '#0b0a08', hero2: '#1877f2', muted: '#5a5a54', rule: '#0b0a08', chipBg: '#0b0a08', chipText: '#c6f24a', ribbon: '#ff5a3c', block: '#0b0a08', blockText: '#fff', dark: false },
  sunny: { grad: 'radial-gradient(circle at 50% 18%, #fff2cf, #ffe19d 72%, #ffd27a)', fg: '#2a1d05', hero: '#2a1d05', hero2: '#e0621a', muted: '#7a5f2a', rule: '#e0621a', chipBg: '#2a1d05', chipText: '#ffd166', ribbon: '#e0432a', block: '#e0621a', blockText: '#fff', dark: false },
  mint:  { grad: 'radial-gradient(circle at 50% 16%, #ecfdf2, #cdf6de 72%, #b6f0cf)', fg: '#06231a', hero: '#06231a', hero2: '#0a9a67', muted: '#3f6b58', rule: '#0a9a67', chipBg: '#06231a', chipText: '#7ef0b8', ribbon: '#ff5a3c', block: '#0a9a67', blockText: '#04140d', dark: false },
  sky:   { grad: 'radial-gradient(circle at 50% 16%, #eef6ff, #d3e8ff 72%, #bcdcff)', fg: '#071a33', hero: '#071a33', hero2: '#1877f2', muted: '#40566f', rule: '#1877f2', chipBg: '#071a33', chipText: '#9bd6ff', ribbon: '#ff5a3c', block: '#1877f2', blockText: '#fff', dark: false },
  paper: { grad: 'radial-gradient(circle at 50% 14%, #f6efe1, #ece0c8 72%, #e3d5b8)', fg: '#1a1409', hero: '#1a1409', hero2: '#b0432a', muted: '#6b5c3f', rule: '#b0432a', chipBg: '#1a1409', chipText: '#f2ece0', ribbon: '#b0432a', block: '#b0432a', blockText: '#fff', dark: false },
  coral: { grad: 'radial-gradient(circle at 50% 16%, #fff1ec, #ffd9cf 72%, #ffc7b8)', fg: '#3a1108', hero: '#3a1108', hero2: '#ff5a3c', muted: '#8a5044', rule: '#ff5a3c', chipBg: '#ff5a3c', chipText: '#fff', ribbon: '#3a1108', block: '#ff5a3c', blockText: '#fff', dark: false },
}

export type Layout = 'center' | 'editorial' | 'stat' | 'split' | 'pricetag' | 'quote' | 'badge' | 'scene'
const LAYOUT_KEYS: Layout[] = ['center', 'editorial', 'stat', 'split', 'pricetag', 'quote', 'badge', 'scene']

export type FbMockSpec = {
  brand: string
  handle?: string | null
  headline: string
  body: string
  cta: string
  url?: string | null
  desc?: string | null
  was?: string | null // the original weak headline, for the "was: … → rebuilt" stamp
  creative: {
    layout?: Layout
    accent?: Accent
    kicker?: string | null
    hero: string
    hero2?: string | null
    subline?: string | null
    offer?: string | null
    offerLabel?: string | null
    urgency?: string | null
    proof?: string | null // a proof line/stat, e.g. "4.9★ · 600+ reviews"
    badges?: string[] | null // 1-3 short trust/credential chips, e.g. ["LICENSED","24/7","20 YRS"]
    scenePrompt?: string | null // (layout "scene") the image brief the copy model writes; the pipeline generates it
    imageUrl?: string | null // (layout "scene") the generated photographic background (data-uri), injected by the pipeline
  }
}

const stripEmoji = (s: string) => s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu, '').replace(/\s+/g, ' ').trim()
const upper = (s: string) => s.toUpperCase()

// Auto-fit a display line to a usable width so a long hero never overflows.
function fit(maxW: number, maxSize: number, minSize: number, ...lines: (string | null | undefined)[]): number {
  const len = Math.max(1, ...lines.filter(Boolean).map((l) => (l as string).length))
  return Math.max(minSize, Math.min(maxSize, Math.round(maxW / (0.55 * len))))
}

// tiny hyperscript so this stays a .ts file (no JSX/tsx)
const h = (type: string, style: Record<string, any>, children?: any) => ({ type, props: children === undefined ? { style } : { style, children } })
const imgNode = (src: string, style: Record<string, any>) => ({ type: 'img', props: { src, style } })

// ───────────────────────── shared element blocks ─────────────────────────
function ribbonEl(pal: Pal, urgency: string) {
  return h('div', { position: 'absolute', top: 36, right: -54, transform: 'rotate(38deg)', backgroundColor: pal.ribbon, color: '#fff', fontFamily: 'Barlow', fontWeight: 900, fontSize: 16, letterSpacing: 3, padding: '9px 66px', textTransform: 'uppercase' }, upper(stripEmoji(urgency)))
}
function chipEl(pal: Pal, offer: string, offerLabel?: string | null) {
  const kids: any[] = [h('div', { fontFamily: 'Barlow', fontWeight: 900, fontSize: 38, letterSpacing: -1, color: pal.chipText }, stripEmoji(offer))]
  if (offerLabel) kids.push(h('div', { fontFamily: 'Barlow', fontWeight: 900, fontSize: 16, letterSpacing: 1, color: pal.chipText, marginLeft: 12, paddingBottom: 3, display: 'flex', alignItems: 'flex-end' }, upper(stripEmoji(offerLabel))))
  return h('div', { display: 'flex', alignItems: 'center', backgroundColor: pal.chipBg, borderRadius: 999, padding: '12px 28px', boxShadow: '0 10px 28px rgba(0,0,0,0.28)' }, kids)
}
function badgesEl(pal: Pal, badges: string[], align: 'center' | 'flex-start' = 'center') {
  const border = pal.dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.35)'
  return h('div', { display: 'flex', flexWrap: 'wrap', justifyContent: align, marginTop: 18 }, badges.slice(0, 3).map((b) =>
    h('div', { display: 'flex', border: `2px solid ${border}`, borderRadius: 8, padding: '7px 13px', marginRight: 9, marginTop: 8, fontFamily: 'Barlow', fontWeight: 900, fontSize: 15, letterSpacing: 0.6, color: pal.fg, textTransform: 'uppercase' }, upper(stripEmoji(b)))))
}
function proofEl(pal: Pal, proof: string, mt = 16) {
  return h('div', { display: 'flex', alignItems: 'center', marginTop: mt, fontFamily: 'Barlow', fontWeight: 700, fontSize: 21, color: pal.hero2 }, stripEmoji(proof))
}
const rule = (pal: Pal, w = 70, m = '22px 0') => h('div', { width: w, height: 4, backgroundColor: pal.hero2, borderRadius: 3, margin: m }, '')
const fill = (flexDirection: string, align: string, justify: string, padding: string, kids: any[]) =>
  h('div', { position: 'absolute', top: 0, left: 0, width: 640, height: 640, display: 'flex', flexDirection, alignItems: align, justifyContent: justify, padding, textAlign: align === 'center' ? 'center' : 'left' }, kids)

// ───────────────────────── layouts (each returns the 640×640 content node) ─────────────────────────
function layoutCenter(c: FbMockSpec['creative'], pal: Pal) {
  const hero = upper(stripEmoji(c.hero)); const hero2 = c.hero2 ? upper(stripEmoji(c.hero2)) : null
  const hs = fit(552, 132, 56, hero, hero2)
  const kids: any[] = []
  if (c.kicker) kids.push(h('div', { color: pal.hero2, fontFamily: 'Barlow', fontWeight: 900, fontSize: 19, letterSpacing: 6, textTransform: 'uppercase', marginBottom: 12 }, upper(stripEmoji(c.kicker))))
  const hl = [h('div', { color: pal.hero }, hero)]; if (hero2) hl.push(h('div', { color: pal.hero2 }, hero2))
  kids.push(h('div', { display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Anton', fontSize: hs, lineHeight: 0.92, letterSpacing: -1, textTransform: 'uppercase', textShadow: pal.dark ? '0 5px 0 rgba(0,0,0,0.30)' : 'none' }, hl))
  if (c.subline) kids.push(h('div', { color: pal.muted, fontFamily: 'Barlow', fontWeight: 600, fontSize: 23, marginTop: 16 }, stripEmoji(c.subline)))
  if (c.proof) kids.push(proofEl(pal, c.proof))
  if (c.offer) { kids.push(rule(pal)); kids.push(chipEl(pal, c.offer, c.offerLabel)) }
  if (c.badges?.length) kids.push(badgesEl(pal, c.badges))
  return fill('column', 'center', 'center', '46px 44px', kids)
}

function layoutEditorial(c: FbMockSpec['creative'], pal: Pal) {
  const hero = upper(stripEmoji(c.hero)); const hero2 = c.hero2 ? upper(stripEmoji(c.hero2)) : null
  const hs = fit(560, 118, 52, hero, hero2)
  const top: any[] = []
  if (c.kicker) top.push(h('div', { color: pal.hero2, fontFamily: 'Barlow', fontWeight: 900, fontSize: 19, letterSpacing: 5, textTransform: 'uppercase', marginBottom: 18 }, upper(stripEmoji(c.kicker))))
  const hl = [h('div', { color: pal.hero }, hero)]; if (hero2) hl.push(h('div', { color: pal.hero2 }, hero2))
  top.push(h('div', { display: 'flex' }, [
    h('div', { display: 'flex', width: 8, backgroundColor: pal.hero2, borderRadius: 4, marginRight: 22, alignSelf: 'stretch' }, ''),
    h('div', { display: 'flex', flexDirection: 'column', fontFamily: 'Anton', fontSize: hs, lineHeight: 0.9, letterSpacing: -1, textTransform: 'uppercase' }, hl),
  ]))
  if (c.subline) top.push(h('div', { color: pal.muted, fontFamily: 'Barlow', fontWeight: 600, fontSize: 24, marginTop: 20, paddingLeft: 30 }, stripEmoji(c.subline)))
  if (c.proof) top.push(h('div', { display: 'flex', paddingLeft: 30 }, proofEl(pal, c.proof, 14)))
  const bottom: any[] = []
  if (c.offer) bottom.push(chipEl(pal, c.offer, c.offerLabel))
  if (c.badges?.length) bottom.push(h('div', { display: 'flex', paddingLeft: 30 }, badgesEl(pal, c.badges, 'flex-start')))
  const kids = [h('div', { display: 'flex', flexDirection: 'column' }, top)]
  if (bottom.length) kids.push(h('div', { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }, bottom))
  return fill('column', 'flex-start', bottom.length ? 'space-between' : 'center', '54px 48px', kids)
}

function layoutStat(c: FbMockSpec['creative'], pal: Pal) {
  const stat = upper(stripEmoji(c.hero))
  const ss = fit(560, 300, 120, stat) // the number/stat dominates
  const kids: any[] = []
  if (c.kicker) kids.push(h('div', { color: pal.hero2, fontFamily: 'Barlow', fontWeight: 900, fontSize: 22, letterSpacing: 6, textTransform: 'uppercase', marginBottom: 6 }, upper(stripEmoji(c.kicker))))
  kids.push(h('div', { fontFamily: 'Anton', fontSize: ss, lineHeight: 0.82, letterSpacing: -3, color: pal.hero2, textShadow: pal.dark ? '0 6px 0 rgba(0,0,0,0.30)' : 'none' }, stat))
  if (c.hero2) kids.push(h('div', { fontFamily: 'Anton', fontSize: 46, letterSpacing: -1, color: pal.hero, marginTop: 4, textTransform: 'uppercase' }, upper(stripEmoji(c.hero2))))
  if (c.subline) kids.push(h('div', { color: pal.muted, fontFamily: 'Barlow', fontWeight: 600, fontSize: 25, marginTop: 18 }, stripEmoji(c.subline)))
  if (c.proof) kids.push(proofEl(pal, c.proof))
  if (c.offer) { kids.push(rule(pal, 70, '22px 0')); kids.push(chipEl(pal, c.offer, c.offerLabel)) }
  if (c.badges?.length) kids.push(badgesEl(pal, c.badges))
  return fill('column', 'center', 'center', '46px 40px', kids)
}

function layoutSplit(c: FbMockSpec['creative'], pal: Pal) {
  const hero = upper(stripEmoji(c.hero)); const hero2 = c.hero2 ? upper(stripEmoji(c.hero2)) : null
  const hs = fit(556, 108, 50, hero, hero2)
  const topKids: any[] = []
  if (c.kicker) topKids.push(h('div', { color: pal.blockText, opacity: 0.82, fontFamily: 'Barlow', fontWeight: 900, fontSize: 18, letterSpacing: 5, textTransform: 'uppercase', marginBottom: 12 }, upper(stripEmoji(c.kicker))))
  const hl = [h('div', {}, hero)]; if (hero2) hl.push(h('div', {}, hero2))
  topKids.push(h('div', { display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Anton', fontSize: hs, lineHeight: 0.9, letterSpacing: -1, color: pal.blockText, textTransform: 'uppercase' }, hl))
  const top = h('div', { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 640, height: 286, backgroundColor: pal.block, color: pal.blockText, padding: '30px 44px', textAlign: 'center' }, topKids)
  const botKids: any[] = []
  if (c.subline) botKids.push(h('div', { color: pal.fg, fontFamily: 'Barlow', fontWeight: 700, fontSize: 25, textAlign: 'center', marginBottom: 6 }, stripEmoji(c.subline)))
  if (c.proof) botKids.push(proofEl(pal, c.proof, 8))
  if (c.offer) { botKids.push(rule(pal, 60, '18px 0')); botKids.push(chipEl(pal, c.offer, c.offerLabel)) }
  if (c.badges?.length) botKids.push(badgesEl(pal, c.badges))
  const bot = h('div', { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 640, height: 354, padding: '24px 44px' }, botKids)
  return h('div', { position: 'absolute', top: 0, left: 0, width: 640, height: 640, display: 'flex', flexDirection: 'column' }, [top, bot])
}

function layoutPricetag(c: FbMockSpec['creative'], pal: Pal) {
  const kids: any[] = []
  if (c.kicker) kids.push(h('div', { color: pal.hero2, fontFamily: 'Barlow', fontWeight: 900, fontSize: 19, letterSpacing: 6, textTransform: 'uppercase', marginBottom: 10 }, upper(stripEmoji(c.kicker))))
  kids.push(h('div', { fontFamily: 'Anton', fontSize: fit(540, 62, 34, upper(stripEmoji(c.hero))), lineHeight: 0.95, letterSpacing: -1, color: pal.hero, textTransform: 'uppercase', marginBottom: 26 }, upper(stripEmoji(c.hero))))
  const price = stripEmoji(c.offer || c.hero2 || '')
  if (price) {
    const tag: any[] = [h('div', { fontFamily: 'Anton', fontSize: fit(430, 150, 72, price), letterSpacing: -2, color: pal.chipText, lineHeight: 0.9 }, price)]
    if (c.offerLabel) tag.push(h('div', { fontFamily: 'Barlow', fontWeight: 900, fontSize: 19, letterSpacing: 1, color: pal.chipText, marginTop: 6, textTransform: 'uppercase' }, upper(stripEmoji(c.offerLabel))))
    kids.push(h('div', { display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: pal.chipBg, borderRadius: 22, padding: '26px 48px', transform: 'rotate(-3deg)', boxShadow: '0 16px 40px rgba(0,0,0,0.32)' }, tag))
  }
  if (c.subline) kids.push(h('div', { color: pal.muted, fontFamily: 'Barlow', fontWeight: 600, fontSize: 23, marginTop: 26 }, stripEmoji(c.subline)))
  if (c.proof) kids.push(proofEl(pal, c.proof))
  if (c.badges?.length) kids.push(badgesEl(pal, c.badges))
  return fill('column', 'center', 'center', '46px 44px', kids)
}

function layoutQuote(c: FbMockSpec['creative'], pal: Pal) {
  const kids: any[] = [h('div', { fontFamily: 'Anton', fontSize: 150, lineHeight: 0.6, color: pal.hero2, marginBottom: 6 }, '“')]
  // testimonial voice: sentence-case Barlow, NOT the all-caps Anton hero — a deliberately different typographic register
  kids.push(h('div', { fontFamily: 'Barlow', fontWeight: 700, fontSize: fit(560, 56, 34, c.hero), lineHeight: 1.18, color: pal.fg, letterSpacing: -0.5 }, stripEmoji(c.hero)))
  kids.push(rule(pal, 64, '26px 0 16px'))
  const attrib = stripEmoji(c.proof || c.subline || c.kicker || '')
  if (attrib) kids.push(h('div', { fontFamily: 'Barlow', fontWeight: 900, fontSize: 20, letterSpacing: 0.5, color: pal.hero2, textTransform: 'uppercase' }, upper(attrib)))
  if (c.offer) kids.push(h('div', { display: 'flex', marginTop: 24 }, chipEl(pal, c.offer, c.offerLabel)))
  return fill('column', 'flex-start', 'center', '54px 50px', kids)
}

function layoutBadge(c: FbMockSpec['creative'], pal: Pal) {
  const seal = upper(stripEmoji((c.badges && c.badges[0]) || c.kicker || 'CERTIFIED'))
  const border = pal.dark ? pal.hero2 : pal.rule
  const kids: any[] = [
    h('div', { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 176, height: 176, borderRadius: 88, border: `6px solid ${border}`, color: pal.hero2, fontFamily: 'Barlow', fontWeight: 900, fontSize: seal.length > 16 ? 22 : 28, letterSpacing: 1, textAlign: 'center', lineHeight: 1.05, padding: 18, textTransform: 'uppercase', marginBottom: 30 }, seal),
    h('div', { display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Anton', fontSize: fit(552, 96, 48, upper(stripEmoji(c.hero)), c.hero2 ? upper(stripEmoji(c.hero2)) : ''), lineHeight: 0.92, letterSpacing: -1, color: pal.hero, textTransform: 'uppercase' },
      [h('div', {}, upper(stripEmoji(c.hero))), ...(c.hero2 ? [h('div', { color: pal.hero2 }, upper(stripEmoji(c.hero2)))] : [])]),
  ]
  if (c.subline) kids.push(h('div', { color: pal.muted, fontFamily: 'Barlow', fontWeight: 600, fontSize: 23, marginTop: 16 }, stripEmoji(c.subline)))
  if (c.offer) { kids.push(rule(pal)); kids.push(chipEl(pal, c.offer, c.offerLabel)) }
  return fill('column', 'center', 'center', '44px 44px', kids)
}

// Photographic scene: an AI-generated, text-free background image with the crisp copy overlaid in a scrimmed
// bottom caption zone (the "put the product in an epic real-world scene" concept). imageUrl is injected by the pipeline.
function layoutScene(c: FbMockSpec['creative'], pal: Pal) {
  const kids: any[] = []
  if (c.imageUrl) kids.push(imgNode(c.imageUrl, { position: 'absolute', top: 0, left: 0, width: 640, height: 640, objectFit: 'cover' }))
  kids.push(h('div', { position: 'absolute', top: 0, left: 0, width: 640, height: 640, backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.92) 3%, rgba(0,0,0,0.55) 33%, rgba(0,0,0,0.04) 62%)' }, ''))
  const hero = upper(stripEmoji(c.hero)); const hero2 = c.hero2 ? upper(stripEmoji(c.hero2)) : null
  const t: any[] = []
  if (c.kicker) t.push(h('div', { color: pal.hero2, fontFamily: 'Barlow', fontWeight: 900, fontSize: 18, letterSpacing: 5, textTransform: 'uppercase', marginBottom: 10, textShadow: '0 2px 10px rgba(0,0,0,0.85)' }, upper(stripEmoji(c.kicker))))
  const hl = [h('div', { color: '#fff' }, hero)]; if (hero2) hl.push(h('div', { color: pal.hero2 }, hero2))
  t.push(h('div', { display: 'flex', flexDirection: 'column', fontFamily: 'Anton', fontSize: fit(556, 92, 46, hero, hero2), lineHeight: 0.9, letterSpacing: -1, textTransform: 'uppercase', color: '#fff', textShadow: '0 4px 18px rgba(0,0,0,0.75)' }, hl))
  if (c.subline) t.push(h('div', { color: '#ececec', fontFamily: 'Barlow', fontWeight: 600, fontSize: 22, marginTop: 12, textShadow: '0 2px 10px rgba(0,0,0,0.9)' }, stripEmoji(c.subline)))
  const row: any[] = []
  if (c.offer) row.push(chipEl(pal, c.offer, c.offerLabel))
  else if (c.proof) row.push(h('div', { display: 'flex', color: '#fff', fontFamily: 'Barlow', fontWeight: 800, fontSize: 20, textShadow: '0 2px 10px rgba(0,0,0,0.9)' }, stripEmoji(c.proof)))
  if (row.length) t.push(h('div', { display: 'flex', alignItems: 'center', marginTop: 20 }, row))
  kids.push(h('div', { position: 'absolute', left: 0, bottom: 0, width: 640, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0 46px 46px', textAlign: 'left' }, t))
  return h('div', { position: 'absolute', top: 0, left: 0, width: 640, height: 640, display: 'flex' }, kids)
}

const LAYOUTS: Record<Layout, (c: FbMockSpec['creative'], pal: Pal) => any> = {
  center: layoutCenter, editorial: layoutEditorial, stat: layoutStat, split: layoutSplit, pricetag: layoutPricetag, quote: layoutQuote, badge: layoutBadge, scene: layoutScene,
}

/** The inner ad CREATIVE (deterministic designed graphic). 640×640 logical → rasterized to 1080². */
function creativeNode(spec: FbMockSpec) {
  const c = spec.creative
  const pal = PALETTES[c.accent && PALETTES[c.accent] ? c.accent : 'bold']
  let layout: Layout = c.layout && LAYOUTS[c.layout] ? c.layout : 'center'
  if (layout === 'scene' && !c.imageUrl) layout = 'editorial' // scene needs its generated image; degrade gracefully
  let content: any
  try { content = LAYOUTS[layout](c, pal) } catch { content = layoutCenter(c, pal) } // safe fallback — never fail a render
  const kids: any[] = [content]
  if (c.urgency && layout !== 'split') kids.push(ribbonEl(pal, c.urgency))
  return h('div', { display: 'flex', position: 'relative', width: 640, height: 640, backgroundImage: pal.grad, color: pal.fg, overflow: 'hidden' }, kids)
}

/** The full FB feed-ad MOCKUP card on a branded backdrop (1080×1350). */
function tree(spec: FbMockSpec) {
  const av = (spec.brand || 'A').trim()[0]?.toUpperCase() || 'A'
  const creative = creativeNode(spec)

  const header = h('div', { display: 'flex', alignItems: 'center', padding: '13px 15px 9px' }, [
    h('div', { display: 'flex', width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', marginRight: 11 }, h('div', { fontFamily: 'Anton', fontSize: 22, color: '#c6f24a' }, av)),
    h('div', { display: 'flex', flexDirection: 'column', flexGrow: 1 }, [
      h('div', { display: 'flex', alignItems: 'center', fontFamily: 'Barlow', fontWeight: 700, fontSize: 16, color: '#050505' }, [
        h('div', {}, spec.brand),
        h('div', { display: 'flex', width: 17, height: 17, borderRadius: 9, backgroundColor: '#1877f2', color: '#fff', fontFamily: 'Barlow', fontWeight: 900, fontSize: 11, alignItems: 'center', justifyContent: 'center', marginLeft: 5 }, '✓'),
      ]),
      h('div', { fontFamily: 'Barlow', fontWeight: 400, fontSize: 13, color: '#65676b', marginTop: 1 }, 'Sponsored'),
    ]),
    h('div', { fontFamily: 'Barlow', fontWeight: 700, fontSize: 22, color: '#65676b' }, '···'),
  ])
  const primary = h('div', { fontFamily: 'Barlow', fontWeight: 400, fontSize: 22, lineHeight: 1.4, color: '#050505', padding: '2px 15px 13px' }, spec.body)
  const foot = h('div', { display: 'flex', alignItems: 'center', backgroundColor: '#f0f2f5', borderTop: '1px solid #ced0d4', padding: '13px 15px' }, [
    h('div', { display: 'flex', flexDirection: 'column', flexGrow: 1, paddingRight: 12 }, [
      h('div', { fontFamily: 'Barlow', fontWeight: 600, fontSize: 12, letterSpacing: 0.4, color: '#65676b', textTransform: 'uppercase' }, (spec.url || `${(spec.handle || spec.brand).replace(/^@/, '')}.com`).toUpperCase()),
      h('div', { fontFamily: 'Barlow', fontWeight: 700, fontSize: 19, lineHeight: 1.2, color: '#050505', marginTop: 2 }, spec.headline),
      ...(spec.desc ? [h('div', { fontFamily: 'Barlow', fontWeight: 400, fontSize: 14, color: '#65676b', marginTop: 2 }, spec.desc)] : []),
    ]),
    h('div', { display: 'flex', fontFamily: 'Barlow', fontWeight: 700, fontSize: 16, color: '#050505', backgroundColor: '#e4e6eb', borderRadius: 7, padding: '10px 18px', whiteSpace: 'nowrap' }, spec.cta),
  ])
  const eng = h('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 15px 9px' }, [
    h('div', { display: 'flex', alignItems: 'center' }, [
      h('div', { display: 'flex', width: 22, height: 22, borderRadius: 11, backgroundColor: '#1877f2', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontFamily: 'Barlow', fontWeight: 900 }, '+'),
      h('div', { display: 'flex', width: 22, height: 22, borderRadius: 11, backgroundColor: '#f3425f', marginLeft: -6, border: '2px solid #fff' }, ''),
      h('div', { fontFamily: 'Barlow', fontWeight: 400, fontSize: 15, color: '#65676b', marginLeft: 8 }, '312'),
    ]),
    h('div', { fontFamily: 'Barlow', fontWeight: 400, fontSize: 15, color: '#65676b' }, '28 comments · 41 shares'),
  ])
  const acts = h('div', { display: 'flex', borderTop: '1px solid #ced0d4', padding: '4px 6px' }, ['Like', 'Comment', 'Share'].map((a) =>
    h('div', { display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: '11px 0', fontFamily: 'Barlow', fontWeight: 600, fontSize: 16, color: '#65676b' }, a)))

  const card = h('div', { display: 'flex', flexDirection: 'column', width: 640, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 24px 70px rgba(0,0,0,0.55)' }, [header, primary, creative, foot, eng, acts])

  const stampKids: any[] = []
  if (spec.was) stampKids.push(h('div', { color: '#6b6a64', fontFamily: 'Barlow', fontWeight: 900, fontSize: 15 }, `was: "${stripEmoji(spec.was)}"  →`))
  stampKids.push(h('div', { color: '#c6f24a', fontFamily: 'Barlow', fontWeight: 900, fontSize: 16, marginLeft: 8 }, 'rebuilt by adchad.ai'))
  const stamp = h('div', { display: 'flex', alignItems: 'center', marginTop: 22 }, stampKids)

  return h('div', { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 1080, height: 1350, backgroundColor: '#0b0a08', backgroundImage: 'radial-gradient(circle at 50% 8%, #1a1712, #0b0a08 62%)', padding: 40 }, [card, stamp])
}

let wasmReady: Promise<void> | null = null
function ensureWasm(): Promise<void> {
  if (!wasmReady) {
    const wasm = readFileSync(join(process.cwd(), 'node_modules', '@resvg', 'resvg-wasm', 'index_bg.wasm'))
    wasmReady = initWasm(wasm)
  }
  return wasmReady
}

// Optional emoji support inside body copy (twemoji SVGs). Fail-safe: a miss just renders nothing.
async function loadEmoji(segment: string): Promise<string | undefined> {
  try {
    const cp = Array.from(segment).map((ch) => ch.codePointAt(0)!.toString(16)).filter((x) => x !== 'fe0f').join('-')
    const res = await fetch(`https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/${cp}.svg`)
    if (!res.ok) return undefined
    return `data:image/svg+xml;base64,${Buffer.from(await res.text()).toString('base64')}`
  } catch { return undefined }
}

const satoriOpts = (width: number, height: number) => ({
  width, height, fonts: FONTS as any,
  loadAdditionalAsset: async (code: string, segment: string) => (code === 'emoji' ? (await loadEmoji(segment)) || '' : ''),
})

async function rasterize(svg: string, outWidth: number): Promise<Uint8Array> {
  await ensureWasm()
  return new Resvg(svg, { fitTo: { mode: 'width', value: outWidth }, font: { loadSystemFonts: false } }).render().asPng()
}

/** Full FB-mockup card → PNG (1080×1350, 4:5). The lead tweet / public proof. */
export async function renderFbMockPng(spec: FbMockSpec): Promise<Uint8Array> {
  return rasterize(await satori(tree(spec) as any, satoriOpts(1080, 1350)), 1080)
}

/** Bare inner creative → PNG (1080×1080, 1:1). The asset the buyer drops straight into Meta. */
export async function renderCreativePng(spec: FbMockSpec): Promise<Uint8Array> {
  return rasterize(await satori(creativeNode(spec) as any, satoriOpts(640, 640)), 1080)
}

// exported for the copy model's design vocabulary + validation
export const CREATIVE_LAYOUTS = LAYOUT_KEYS
export const CREATIVE_ACCENTS = Object.keys(PALETTES) as Accent[]

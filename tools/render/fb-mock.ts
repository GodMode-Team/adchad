import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import satori from 'satori'
import { Resvg, initWasm } from '@resvg/resvg-wasm'

/**
 * Deterministic Meta-ad renderer. Two outputs from one spec:
 *   - renderFbMockPng  → the full FB feed-ad MOCKUP (how it looks live) — the lead tweet / public proof.
 *   - renderCreativePng → the BARE inner creative at 1080×1080 — the actual asset the buyer uploads to Meta.
 *
 * The copy (headline / primary text / CTA) is rendered in the DOM — never handed to an image model — so it is
 * ALWAYS crisp and never distorted (the root cause of the old gpt-image-2 slop: dashboards, AI-meat). Anatomy
 * follows the standard FB feed-ad card (header · primary text · creative · headline+CTA bar · engagement).
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

// Vertical-aware palettes for the inner creative. accent is chosen by the copy model.
type Accent = 'warm' | 'cool' | 'fresh' | 'bold' | 'lime'
const PALETTE: Record<Accent, { grad: string; kicker: string; hero2: string; chipBg: string; chipText: string; ribbon: string }> = {
  warm: { grad: 'radial-gradient(circle at 50% 30%, #6b2f12, #2a1408 52%, #120a05)', kicker: '#ffb24a', hero2: '#ffae3a', chipBg: '#c6f24a', chipText: '#0b0a08', ribbon: '#ff5a3c' },
  cool: { grad: 'radial-gradient(circle at 50% 28%, #173a59, #0c1c2e 54%, #070d14)', kicker: '#6cc0ff', hero2: '#9bd6ff', chipBg: '#c6f24a', chipText: '#0b0a08', ribbon: '#ff5a3c' },
  fresh: { grad: 'radial-gradient(circle at 50% 30%, #11503b, #0a2a20 54%, #06140d)', kicker: '#5fe0a8', hero2: '#86f0c0', chipBg: '#c6f24a', chipText: '#0b0a08', ribbon: '#ff5a3c' },
  bold: { grad: 'radial-gradient(circle at 50% 28%, #2c2c31, #161618 55%, #0a0a0b)', kicker: '#c6f24a', hero2: '#c6f24a', chipBg: '#c6f24a', chipText: '#0b0a08', ribbon: '#ff5a3c' },
  lime: { grad: 'radial-gradient(circle at 50% 30%, #1d3a0f, #102207 55%, #070f04)', kicker: '#d6ff66', hero2: '#c6f24a', chipBg: '#0b0a08', chipText: '#c6f24a', ribbon: '#ff5a3c' },
}

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
    kicker?: string | null
    hero: string
    hero2?: string | null
    subline?: string | null
    offer?: string | null
    offerLabel?: string | null
    urgency?: string | null
    accent?: Accent
  }
}

const stripEmoji = (s: string) => s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu, '').replace(/\s+/g, ' ').trim()
const upper = (s: string) => s.toUpperCase()

// Anton auto-fit: keep the big hero line from overflowing the 552px usable width.
function heroSize(...lines: (string | null | undefined)[]): number {
  const max = Math.max(1, ...lines.filter(Boolean).map((l) => (l as string).length))
  return Math.max(58, Math.min(132, Math.round(540 / (0.55 * max))))
}

// tiny hyperscript so this stays a .ts file (no JSX/tsx)
const h = (type: string, style: Record<string, any>, children?: any) => ({ type, props: children === undefined ? { style } : { style, children } })

/** The inner ad CREATIVE (deterministic designed graphic — the part that used to be AI slop). 640×640 logical. */
function creativeNode(spec: FbMockSpec) {
  const c = spec.creative
  const pal = PALETTE[c.accent && PALETTE[c.accent] ? c.accent : 'bold']
  const hero = upper(stripEmoji(c.hero))
  const hero2 = c.hero2 ? upper(stripEmoji(c.hero2)) : null
  const hsize = heroSize(hero, hero2)

  const kids: any[] = []
  if (c.urgency)
    kids.push(h('div', { position: 'absolute', top: 34, right: -52, transform: 'rotate(38deg)', backgroundColor: pal.ribbon, color: '#fff', fontFamily: 'Barlow', fontWeight: 900, fontSize: 16, letterSpacing: 3, padding: '9px 64px', textTransform: 'uppercase' }, upper(stripEmoji(c.urgency))))
  const center: any[] = []
  if (c.kicker) center.push(h('div', { color: pal.kicker, fontFamily: 'Barlow', fontWeight: 900, fontSize: 19, letterSpacing: 6, textTransform: 'uppercase', marginBottom: 12 }, upper(stripEmoji(c.kicker))))
  const heroLines = [h('div', { color: '#fff' }, hero)]
  if (hero2) heroLines.push(h('div', { color: pal.hero2 }, hero2))
  center.push(h('div', { display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Anton', fontSize: hsize, lineHeight: 0.92, letterSpacing: -1, textTransform: 'uppercase', textShadow: '0 5px 0 rgba(0,0,0,0.32)' }, heroLines))
  if (c.subline) center.push(h('div', { color: '#f3e7d6', fontFamily: 'Barlow', fontWeight: 600, fontSize: 23, marginTop: 16, letterSpacing: 0.5 }, stripEmoji(c.subline)))
  if (c.offer) {
    center.push(h('div', { width: 70, height: 4, backgroundColor: pal.hero2, borderRadius: 3, margin: '24px 0' }, ''))
    const chip: any[] = [h('div', { fontFamily: 'Barlow', fontWeight: 900, fontSize: 38, letterSpacing: -1, color: pal.chipText }, stripEmoji(c.offer))]
    if (c.offerLabel) chip.push(h('div', { fontFamily: 'Barlow', fontWeight: 900, fontSize: 16, letterSpacing: 1, color: pal.chipText, marginLeft: 12, paddingBottom: 3, display: 'flex', alignItems: 'flex-end' }, upper(stripEmoji(c.offerLabel))))
    center.push(h('div', { display: 'flex', alignItems: 'center', backgroundColor: pal.chipBg, borderRadius: 999, padding: '12px 28px', boxShadow: '0 10px 28px rgba(0,0,0,0.35)' }, chip))
  }
  kids.push(h('div', { position: 'absolute', top: 0, left: 0, width: 640, height: 640, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '46px 44px', textAlign: 'center' }, center))
  return h('div', { display: 'flex', position: 'relative', width: 640, height: 640, backgroundImage: pal.grad, color: '#fff', overflow: 'hidden' }, kids)
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

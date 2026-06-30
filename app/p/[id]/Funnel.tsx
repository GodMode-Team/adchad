'use client'

import { useEffect, useState, type ReactNode } from 'react'
import LiveFeed from '../../LiveFeed'
import MetaAd from '../../MetaAd'

type Step = 'roast' | 'paywall' | 'done'

const isVideo = (u?: string | null) => !!u && /\.(mp4|webm|mov)$/i.test(u)

// Layout: green fills the full page; content lives in a max-width container that goes 2-column on wide screens
// (flex-wrap → stacks on mobile, exactly like the homepage). All in globals.css `.fnl-shell`.
function Shell({ children }: { children: ReactNode }) {
  return <main className="fnl-shell">{children}</main>
}

// Full-bleed section band (home-page style): a background color + ink divider, content centered in a max-width column.
function Band({ bg, children, last, gap = 20 }: { bg: string; children: ReactNode; last?: boolean; gap?: number }) {
  return (
    <div style={{ background: bg, borderBottom: last ? undefined : '4px solid var(--ink)' }}>
      <div style={{ width: '100%', maxWidth: 680, margin: '0 auto', padding: '28px 18px', display: 'flex', flexDirection: 'column', gap }}>{children}</div>
    </div>
  )
}
const PAGE = { width: '100%', maxWidth: 1080, margin: '0 auto' } as const
const ROW = { display: 'flex', flexWrap: 'wrap', gap: 30, alignItems: 'flex-start' } as const
const COL = { flex: '1 1 340px', minWidth: 0 } as const

// Black scrolling marquee — two identical halves translate -50% on loop (keyframe `mq`).
// ponytail: each half is the phrase ×REP so one half always exceeds the viewport (4× ≈ 2.4–3.6k px covers up to ~5K
// displays) — otherwise a phrase sized for a phone leaves a blank gap on the right of a wide screen. Duration scales
// with REP to keep the pixels-per-second the designer tuned. Bump REP if an ultrawide ever gaps.
const REP = 4
function Marquee({ text, color, seconds = 13 }: { text: string; color: string; seconds?: number }) {
  const half = text.repeat(REP)
  return (
    <div style={{ height: 38, flex: 'none', background: 'var(--ink)', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
      <div style={{ display: 'flex', whiteSpace: 'nowrap', fontFamily: 'var(--f-bungee)', fontSize: 14, color, animation: `mq ${seconds * REP}s linear infinite` }}>
        <span>{half}</span>
        <span>{half}</span>
      </div>
    </div>
  )
}

// Sticky bottom CTA bar — full-bleed ink bar, button capped + centered so it isn't absurdly wide on desktop.
// `display` is owned by `.cta-bar-base` (CSS) so a className like `roast-ctabar` can hide it on desktop via media query.
function CtaBar({ children, as = 'div', href, onClick, className }: { children: ReactNode; as?: 'a' | 'div'; href?: string; onClick?: () => void; className?: string }) {
  const inner = <div style={{ maxWidth: 520, margin: '0 auto' }}>{children}</div>
  const style = { flex: 'none', width: '100%', border: 0, background: 'var(--ink)', padding: '16px 20px', cursor: 'pointer', zIndex: 5 } as const // position lives in .cta-bar-base / .roast-ctabar (CSS) so a media query can flip sticky→fixed→hidden
  const cls = `cta-bar-base${className ? ' ' + className : ''}`
  return as === 'a' ? <a href={href} style={style} className={cls}>{inner}</a> : <button onClick={onClick} style={style} className={cls}>{inner}</button>
}

// One ad creative (image or video) rendered from a real URL.
function Creative({ url, controls = false }: { url?: string | null; controls?: boolean }) {
  if (!url) {
    return (
      <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'repeating-linear-gradient(45deg,#e9ebee,#e9ebee 11px,#dfe2e6 11px,#dfe2e6 22px)' }}>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: '#9aa0a6', background: '#fff8', padding: '3px 8px', borderRadius: 4 }}>no creative captured</span>
      </div>
    )
  }
  return isVideo(url)
    ? <video src={url} controls={controls} muted playsInline style={{ width: '100%', display: 'block' }} />
    : <img src={url} alt="your ad" style={{ width: '100%', display: 'block' }} />
}

// The crude meme cast Chad has "unfucked" — drawn as inline SVG so the jank is the brand (a polished portrait would be
// the slop he roasts). Each lives inside a green avatar disc so the testimonial cards read like real review profiles.
type MemeKind = 'wojak' | 'soyjak' | 'npc'
function MemeFace({ kind }: { kind: MemeKind }) {
  const faces: Record<MemeKind, ReactNode> = {
    // the Virgin / Wojak — melancholic, bald, simple frown
    wojak: (
      <>
        <path d="M13 22 q19 -13 38 0" fill="none" stroke="#111" strokeWidth="2.4" strokeLinecap="round" />
        <ellipse cx="32" cy="35" rx="20" ry="24" fill="#efe0d2" stroke="#111" strokeWidth="2.4" />
        <circle cx="24" cy="31" r="2.3" fill="#111" />
        <circle cx="40" cy="31" r="2.3" fill="#111" />
        <path d="M32 33 l-2 9 q2 2 4 0" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M24 49 q8 5 16 0" fill="none" stroke="#111" strokeWidth="2.4" strokeLinecap="round" />
      </>
    ),
    // the Soyjak — round glasses, gaping excited mouth, patchy scruff
    soyjak: (
      <>
        <ellipse cx="32" cy="34" rx="20" ry="24" fill="#f0ddc9" stroke="#111" strokeWidth="2.4" />
        <circle cx="24" cy="30" r="6" fill="#fff" stroke="#111" strokeWidth="2" />
        <circle cx="40" cy="30" r="6" fill="#fff" stroke="#111" strokeWidth="2" />
        <line x1="30" y1="30" x2="34" y2="30" stroke="#111" strokeWidth="2" />
        <circle cx="24" cy="30" r="1.6" fill="#111" />
        <circle cx="40" cy="30" r="1.6" fill="#111" />
        <ellipse cx="32" cy="46" rx="5" ry="6.5" fill="#7a2233" stroke="#111" strokeWidth="2" />
        <path d="M19 41 q13 11 26 0" fill="none" stroke="#111" strokeWidth="1" strokeDasharray="1.5 3" />
      </>
    ),
    // the NPC — featureless gray blockhead, dead-flat mouth
    npc: (
      <>
        <rect x="13" y="11" width="38" height="44" rx="9" fill="#b9bdc2" stroke="#111" strokeWidth="2.4" />
        <circle cx="25" cy="30" r="2.3" fill="#111" />
        <circle cx="39" cy="30" r="2.3" fill="#111" />
        <line x1="25" y1="43" x2="39" y2="43" stroke="#111" strokeWidth="2.4" strokeLinecap="round" />
      </>
    ),
  }
  return (
    <div style={{ width: 50, height: 50, flex: 'none', borderRadius: '50%', background: 'var(--pink)', border: '2.5px solid var(--ink)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 64 64" width="44" height="44" aria-hidden="true">{faces[kind]}</svg>
    </div>
  )
}

// Obviously-fake testimonials — the joke is that they're transparently fake (names, specifics, the looping NPC).
// Real social proof at the payment moment, played as a bit. Earnest-dumb customers contrast with Chad's deadpan.
const TESTIMONIALS: { kind: MemeKind; quote: string; name: string; tag: string }[] = [
  { kind: 'wojak', quote: 'chad called my ad dogshit, then made it not dogshit. my wife came back.', name: 'Greg', tag: 'definitely a real plumber' },
  { kind: 'soyjak', quote: 'BEST FIVE DOLLARS IVE EVER SPENT AND I SPEND A LOT OF FIVE DOLLARS', name: 'a verified buyer', tag: '(probably)' },
  { kind: 'npc', quote: '5 stars. i have no other thoughts. i have no other thoughts. i have no oth', name: 'NPC #4417', tag: 'left a review' },
]

export default function Funnel({ data, paid, id, initialStep }: { data: any; paid: boolean; id: string; initialStep?: Step }) {
  // If they're back from Stripe (?paid=1), drop them straight on the celebration screen.
  // initialStep lets a preview route land directly on any step.
  const [step, setStep] = useState<Step>(initialStep ?? (paid ? 'done' : 'roast'))
  const [bump, setBump] = useState(false)

  const score: number | null = data.score ?? null
  const scoreStr = score != null ? `${score}/100` : 'unscored'
  const name: string = data.name || 'this brand'
  const creative: string | null = data.ad?.creative_url ?? null
  const roast: string | null = data.roast_text ?? null

  const tier = bump ? 12 : 5
  const checkoutHref = `/api/checkout?p=${encodeURIComponent(id)}&tier=${tier}`

  // Thank-you page state: the $49 upsell decline/hire + this order's fix status (polled → swaps the placeholder for the tweet).
  const [declined, setDeclined] = useState(false)
  const [hired, setHired] = useState(false)
  const [hiring, setHiring] = useState(false)
  // hosted-Checkout fallback returns to ?hired=1 — land them straight on the "great choice" state.
  useEffect(() => { if (new URLSearchParams(window.location.search).get('hired') === '1') setHired(true) }, [])
  // One-click hire: charge the saved card; if there's no usable card / SCA, Stripe Checkout takes over.
  async function hireChadNow() {
    if (hiring) return
    setHiring(true)
    try {
      const r = await fetch(`/api/upsell?p=${encodeURIComponent(id)}`, { method: 'POST' })
      const d = await r.json()
      if (d?.status === 'subscribed' || d?.status === 'already') setHired(true)
      else if (d?.url) window.location.assign(d.url)
      else setHiring(false)
    } catch { setHiring(false) }
  }
  const [fix, setFix] = useState<{ delivered: boolean; tweetUrl?: string | null; image?: string | null; headline?: string | null; body?: string | null; cta?: string | null; name?: string | null }>({ delivered: false })
  const tweetId = fix.tweetUrl ? fix.tweetUrl.match(/status\/(\d+)/)?.[1] ?? null : null

  useEffect(() => {
    if (step !== 'done' || fix.delivered) return
    let on = true
    let t: ReturnType<typeof setInterval>
    const pull = async () => {
      try {
        const r = await fetch(`/api/fix-status?p=${encodeURIComponent(id)}`, { cache: 'no-store' })
        const d = await r.json()
        if (on && d?.delivered) { setFix(d); clearInterval(t) }
      } catch { /* keep polling */ }
    }
    pull()
    t = setInterval(pull, 5000)
    return () => { on = false; clearInterval(t) }
  }, [step, id, fix.delivered])

  // Once the fix tweet is known, render it as a real embedded tweet (load X's widget script on demand).
  useEffect(() => {
    if (!tweetId) return
    const w = window as any
    if (w.twttr?.widgets) { w.twttr.widgets.load(); return }
    const s = document.createElement('script')
    s.src = 'https://platform.twitter.com/widgets.js'
    s.async = true
    s.onload = () => w.twttr?.widgets?.load?.()
    document.body.appendChild(s)
  }, [tweetId])

  // ============================ ROAST ============================
  if (step === 'roast') {
    return (
      <Shell>
        <Marquee color="var(--pink)" text={` EXHIBIT A ● I PULLED ${name.toUpperCase()}'S LIVE AD ● IT'S BAD ● ${scoreStr} ● `} />
        <div style={{ flex: 1, padding: '30px 20px 110px' }}>{/* extra bottom space so the fixed mobile CTA bar never covers content */}
          <div style={PAGE}>
            <div style={{ display: 'inline-block', transform: 'rotate(-3deg)', background: 'var(--pink)', color: '#fff', fontFamily: 'var(--f-heavy)', fontSize: 28, padding: '4px 14px', border: '4px solid var(--ink)', boxShadow: '5px 5px 0 var(--ink)' }}>
              I FOUND YOUR AD
            </div>

            <div style={{ ...ROW, marginTop: 28 }}>
              {/* LEFT — the exhibit */}
              <div style={{ ...COL, paddingTop: 16 }}>
                <MetaAd name={name} body={data.ad?.copy} creative={creative} controls rotate={-1.5} />
              </div>

              {/* RIGHT — score → verdict → "I wrote the good one" */}
              <div style={{ ...COL, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: 12, fontWeight: 700, color: '#04210d' }}>MY SCORE<br />FOR IT →</div>
                  <div style={{ position: 'relative' }}>
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: 64, lineHeight: 0.8, color: 'var(--ink)' }}>
                      {score != null ? score : '??'}<span style={{ fontSize: 22 }}>/100</span>
                    </div>
                    <div style={{ position: 'absolute', inset: '-10px -14px', border: '4px solid #ff1414', borderRadius: '50%', transform: 'rotate(-7deg)', pointerEvents: 'none' }} />
                  </div>
                </div>

                {roast && (
                  <div style={{ background: 'var(--ink)', color: 'var(--fg)', borderRadius: 14, padding: '16px 16px 18px', transform: 'rotate(-0.5deg)', boxShadow: '5px 5px 0 rgba(0,0,0,.25)' }}>
                    <div style={{ fontFamily: 'var(--f-bungee)', fontSize: 13, color: 'var(--green)', marginBottom: 8 }}>THE VERDICT</div>
                    <div style={{ fontSize: 16, lineHeight: 1.45, fontWeight: 600 }}>{roast}</div>
                  </div>
                )}

                {/* MOBILE — Chad + tease; the actual button is the pinned bottom bar */}
                <div className="roast-handoff-mobile" style={{ alignItems: 'flex-end', gap: 10, marginTop: 2 }}>
                  <img src="/chad-cutout.png" alt="" style={{ width: 96, flex: 'none', transformOrigin: 'bottom center', animation: 'wobble 3.2s ease-in-out infinite' }} />
                  <div style={{ fontFamily: 'var(--f-marker)', color: 'var(--ink)', fontSize: 18, transform: 'rotate(-3deg)', paddingBottom: 18 }}>I already wrote<br />the good one →</div>
                </div>

                {/* DESKTOP — the CTA sits right under the verdict, Chad dancing beside it */}
                <div className="roast-cta-desktop" style={{ flexDirection: 'column', gap: 10, marginTop: 6 }}>
                  <div style={{ fontFamily: 'var(--f-marker)', color: 'var(--ink)', fontSize: 18, transform: 'rotate(-2deg)' }}>I already wrote the good one ↓</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button onClick={() => setStep('paywall')} style={{ cursor: 'pointer', background: 'var(--yellow)', border: '4px solid #fff', borderRadius: 14, padding: '16px 24px', boxShadow: '0 0 0 4px var(--ink)', transform: 'rotate(-1deg)', animation: 'throb 2.4s ease-in-out infinite', fontFamily: 'var(--f-bungee)', fontSize: 22, color: 'var(--ink)' }}>UNFUCK IT → $5</button>
                    <img src="/chad-cutout.png" alt="" style={{ width: 92, flex: 'none', transformOrigin: 'bottom center', animation: 'bounce 1.4s ease-in-out infinite' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CtaBar onClick={() => setStep('paywall')} className="roast-ctabar">
          <div style={{ background: 'var(--yellow)', border: '4px solid #fff', borderRadius: 14, padding: '16px 14px', textAlign: 'center', boxShadow: '0 0 0 4px var(--ink)', transform: 'rotate(-1deg)', animation: 'throb 2.4s ease-in-out infinite' }}>
            <span style={{ fontFamily: 'var(--f-bungee)', fontSize: 24, color: 'var(--ink)' }}>UNFUCK IT → $5</span>
          </div>
        </CtaBar>
      </Shell>
    )
  }

  // ============================ PAYWALL (the checkout) ============================
  if (step === 'paywall') {
    // Itemized so it reads like a register: the bump adds a real line + ticks the total.
    const lineItems: [string, string][] = [['the $5 unfuck', '$5.00']]
    if (bump) lineItems.push(['+2 A/B variants', '$7.00'])
    const checks = ['new headline, body & CTA', 'a ready-to-use HD generated ad image', 'ready in ~2 minutes']
    return (
      <Shell>
        <Marquee color="var(--yellow)" seconds={12} text=" THE FIX ● I ALREADY FIXED IT ● UNLOCK $5 ● NEW HEADLINE + CREATIVE ● " />
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>{/* black scroll bg so the dark band reads to the very bottom on tall screens; the band also carries the mobile CTA-bar clearance */}
          <div style={{ background: 'var(--green)' }}>{/* the green upper page; the dark before/after band sits below it */}
          <div style={{ ...PAGE, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 0' }}>
            <button onClick={() => setStep('roast')} style={{ border: 0, background: 'none', cursor: 'pointer', fontFamily: 'var(--f-mono)', fontSize: 12, color: '#04210d', fontWeight: 700 }}>‹ back to roast</button>
            <div style={{ fontFamily: 'var(--f-heavy)', fontSize: 13, color: '#0a5c22' }}>ADCHAD</div>
          </div>

          <div style={{ ...PAGE, padding: '14px 20px 30px' }}>
            <div style={{ ...ROW, gap: 24, alignItems: 'stretch' }}>
              {/* LEFT — THE CHECKOUT (the star; the only big headline lives here now — no duplicate up top) */}
              <div style={{ flex: '1.45 1 380px', minWidth: 0 }}>
                <div style={{ background: '#fff', border: '3px solid var(--ink)', borderRadius: 18, boxShadow: '7px 7px 0 var(--ink)', padding: '24px 24px 22px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 14px', fontFamily: 'var(--f-display)', fontSize: 'clamp(36px, 5vw, 50px)', lineHeight: 1, color: 'var(--ink)' }}>
                    <span>THE</span>
                    <span style={{ background: 'var(--yellow)', padding: '7px 14px 9px', border: '3px solid var(--ink)', boxShadow: '4px 4px 0 var(--ink)' }}>$5 UNFUCK</span>
                  </div>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: 12.5, color: '#5a5d61', marginTop: 13 }}>
                    one rebuilt ad: new copy, a new hook &amp; a fresh creative. delivered instantly.
                  </div>

                  {/* what you get */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '20px 0 2px' }}>
                    {checks.map((t) => (
                      <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 21, height: 21, flex: 'none', borderRadius: 6, background: 'var(--green)', border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: 'var(--ink)' }}>✓</span>
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{t}</span>
                      </div>
                    ))}
                  </div>

                  {/* order bump */}
                  <button onClick={() => setBump((b) => !b)} style={{ width: '100%', textAlign: 'left', marginTop: 18, cursor: 'pointer', border: '2px dashed var(--ink)', borderRadius: 12, padding: 14, display: 'flex', gap: 11, alignItems: 'center', background: bump ? '#fff19a' : '#fffdf2' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, border: '2px solid var(--ink)', flex: 'none', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {bump && <span style={{ color: '#1f9c3a', fontWeight: 900, fontSize: 17 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--f-heavy)', fontSize: 13, color: 'var(--ink)' }}>Add 2 MORE to A/B test <span style={{ color: '#1f9c3a' }}>+$7</span></div>
                      <div style={{ fontSize: 11, color: '#6b6e00' }}>3 images total. Find your winner faster.</div>
                    </div>
                  </button>

                  {/* itemized total — the bit that turns a button into a register */}
                  <div style={{ borderTop: '2px dashed #cfd3d8', marginTop: 18, paddingTop: 13, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {lineItems.map(([label, amt]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--f-mono)', fontSize: 13, color: '#3a3d41' }}>
                        <span>{label}</span><span>{amt}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: '2px solid var(--ink)', marginTop: 10, paddingTop: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontFamily: 'var(--f-heavy)', fontSize: 15, color: 'var(--ink)' }}>TOTAL</span>
                    <span style={{ fontFamily: 'var(--f-display)', fontSize: 32, color: 'var(--ink)', lineHeight: 1 }}>${tier}.00</span>
                  </div>

                  <a href={checkoutHref} style={{ display: 'block', textAlign: 'center', marginTop: 16, background: 'var(--yellow)', border: '4px solid var(--ink)', borderRadius: 14, padding: '16px 14px', boxShadow: '5px 5px 0 var(--ink)', fontFamily: 'var(--f-bungee)', fontSize: 24, color: 'var(--ink)', animation: 'throb 2.4s ease-in-out infinite' }}>
                    TAKE MY ${tier} →
                  </a>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '3px 10px', marginTop: 12, fontFamily: 'var(--f-mono)', fontSize: 10.5, color: '#5a5d61' }}>
                    <span>🔒 secured by Stripe</span><span>·</span><span>a % of every sale → Stripe Climate 🌍</span><span>·</span><span>instant, no account</span>
                  </div>
                </div>
              </div>

              {/* RIGHT — testimonials, with Chad peeking up at the bottom to fill the rail + vouch for his (fake) crew */}
              <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontFamily: 'var(--f-marker)', fontSize: 20, color: 'var(--ink)', transform: 'rotate(-1deg)' }}>people chad has unfucked</div>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: '#0a5c22', marginTop: 3, marginBottom: 16 }}>★ obviously real reviews from definitely real people ★</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {TESTIMONIALS.map((t) => (
                    <div key={t.name} style={{ background: '#fff', border: '2px solid var(--ink)', borderRadius: 12, boxShadow: '4px 4px 0 var(--ink)', padding: '15px 16px', display: 'flex', alignItems: 'center', gap: 13 }}>
                      <MemeFace kind={t.kind} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#f2b705', fontSize: 12.5, letterSpacing: 1.5 }}>★★★★★</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4, marginTop: 3 }}>&ldquo;{t.quote}&rdquo;</div>
                        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: '#8a8d91', marginTop: 6 }}><b style={{ color: '#555' }}>{t.name}</b> · {t.tag}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Chad peeking up — fills the rail's dead-space + deadpan vouch for the (obviously fake) reviewers */}
                <div style={{ marginTop: 'auto', paddingTop: 18, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 4, overflow: 'hidden' }}>
                  <div style={{ fontFamily: 'var(--f-marker)', fontSize: 15, color: 'var(--ink)', transform: 'rotate(-4deg)', paddingBottom: 30, textAlign: 'right', lineHeight: 1.1 }}>↑ real ones.<br />trust me.</div>
                  <img src="/chad-cutout.png" alt="" style={{ width: 152, flex: 'none', marginBottom: -4, transformOrigin: 'bottom center', animation: 'wobble 3.6s ease-in-out infinite' }} />
                </div>
              </div>
            </div>

          </div>{/* end the two-column area */}
          </div>{/* end the green upper page */}

          {/* BLOCK 2 — full-bleed dark band for contrast: your ad, before → after (coral BAD → green CHAD) */}
          <div style={{ background: 'var(--bg)' }}>
            <div style={{ ...PAGE, padding: '38px 20px 90px' }}>
              <div style={{ fontFamily: 'var(--f-marker)', fontSize: 20, color: '#FFF7E7', transform: 'rotate(-0.6deg)', marginBottom: 4 }}>your ad: before &amp; after</div>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: '#8a9088', marginBottom: 18 }}>I scored it {score != null ? score : '??'}/100 — then I fixed it. here&apos;s the swap.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'stretch' }}>
                {/* BEFORE — their real ad (coral frame = the bad one) */}
                <div style={{ flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, fontWeight: 700, color: '#ff6f5e' }}>BEFORE · {score != null ? score : '??'}/100</div>
                  <div style={{ border: '3px solid #ff6f5e', borderRadius: 12, boxShadow: '0 0 22px rgba(255,111,94,.30)', height: 'clamp(180px, 30vw, 280px)', overflow: 'hidden', background: '#fff' }}><Creative url={creative} /></div>
                </div>
                {/* AFTER — the locked fix (green frame = chad's fix); the whole panel is the CTA */}
                <div style={{ flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>AFTER · THE FIX 🔒</div>
                  <a href={checkoutHref} style={{ position: 'relative', display: 'block', border: '3px solid var(--green)', borderRadius: 12, boxShadow: '0 0 22px rgba(60,232,74,.30)', height: 'clamp(180px, 30vw, 280px)', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, filter: 'blur(13px)' }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 70% 25%, #ffd36e, transparent 55%), linear-gradient(150deg,#13131a 0%,#3a0f24 50%,#ff2d6f 120%)' }} />
                      <div style={{ position: 'absolute', right: '-8%', bottom: '-12%', width: '46%', height: '64%', borderRadius: '50% 50% 44% 44%', background: 'linear-gradient(160deg,#f6c89a,#caa074)' }} />
                      <div style={{ position: 'absolute', left: '6%', top: '12%', width: '24%', height: 10, borderRadius: 4, background: 'var(--yellow)' }} />
                      <div style={{ position: 'absolute', left: '6%', top: '24%', width: '50%', height: 15, borderRadius: 3, background: '#fff' }} />
                      <div style={{ position: 'absolute', left: '6%', top: '36%', width: '38%', height: 15, borderRadius: 3, background: '#fff' }} />
                      <div style={{ position: 'absolute', left: '6%', bottom: '12%', width: '42%', height: 20, borderRadius: 8, background: 'var(--green)' }} />
                    </div>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <div style={{ fontSize: 30 }}>🔒</div>
                      <div style={{ fontFamily: 'var(--f-bungee)', fontSize: 13, color: 'var(--ink)', background: 'var(--yellow)', border: '3px solid var(--ink)', boxShadow: '3px 3px 0 var(--ink)', padding: '8px 14px', borderRadius: 10 }}>UNLOCK FOR ${tier}</div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* mobile only — a pinned pay bar for when the order card scrolls away (the card's own button covers desktop) */}
        <CtaBar as="a" href={checkoutHref} className="paywall-ctabar">
          <div style={{ background: 'var(--yellow)', border: '4px solid #fff', borderRadius: 14, padding: 14, textAlign: 'center', boxShadow: '0 0 0 4px var(--ink)', transform: 'rotate(-1deg)', animation: 'throb 2.4s ease-in-out infinite' }}>
            <span style={{ fontFamily: 'var(--f-bungee)', fontSize: 23, color: 'var(--ink)' }}>TAKE MY ${tier}</span>
          </div>
        </CtaBar>
      </Shell>
    )
  }

  // ============================ DONE (paid=1) ============================
  return (
    <Shell>
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--yellow)' }}>

        {/* A — payment + upsell video (green). Once hired, the video goes away. */}
        <Band bg="var(--green)">
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 40, lineHeight: 0.9, color: 'var(--ink)' }}>PAYMENT RECEIVED.</div>
          {!hired && (
            <video
              src="https://teaser-page-virid.vercel.app/adchad-upsell.mp4"
              controls autoPlay muted playsInline
              style={{ width: '100%', display: 'block', borderRadius: 14, border: '3px solid var(--ink)', boxShadow: '6px 6px 0 var(--ink)', background: '#000' }}
            />
          )}
        </Band>

        {/* B — the pitch + Yes/No (pink). Hire → "great choice" + the intake form. */}
        <Band bg="var(--pink)">
          {hired ? (
            <>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 34, lineHeight: 0.92, color: '#fff' }}>GREAT CHOICE.</div>
              <div style={{ fontFamily: 'var(--f-heavy)', fontSize: 18, lineHeight: 1.3, color: '#fff' }}>
                Fill out this form and I&apos;ll get started. You can expect your first report a week from filling out the form.
              </div>
              <a href={`/onboard/${encodeURIComponent(id)}`} style={{ display: 'inline-block', textAlign: 'center', background: 'var(--yellow)', border: '4px solid var(--ink)', borderRadius: 14, padding: '15px 22px', boxShadow: '4px 4px 0 var(--ink)', fontFamily: 'var(--f-bungee)', fontSize: 18, color: 'var(--ink)' }}>
                FILL OUT THE FORM →
              </a>
            </>
          ) : (
            <>
              <div style={{ fontFamily: 'var(--f-heavy)', fontSize: 19, lineHeight: 1.2, color: '#fff' }}>
                By the time you finish watching this video, your ad will be ready.
              </div>
              {declined ? (
                <button onClick={hireChadNow} disabled={hiring} style={{ cursor: hiring ? 'wait' : 'pointer', background: 'none', border: 0, padding: 0, fontFamily: 'var(--f-mono)', fontSize: 13, fontWeight: 700, color: '#fff', textAlign: 'left' }}>
                  💀 enjoy the losses — changed your mind? Hire Chad, $49/mo →
                </button>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <button onClick={hireChadNow} disabled={hiring} style={{ flex: '1 1 240px', cursor: hiring ? 'wait' : 'pointer', textAlign: 'center', background: 'var(--yellow)', border: '4px solid var(--ink)', borderRadius: 14, padding: '15px 16px', boxShadow: '4px 4px 0 var(--ink)', fontFamily: 'var(--f-bungee)', fontSize: 17, color: 'var(--ink)' }}>
                    {hiring ? 'one sec…' : 'Hire Chad now for $49/mo'}
                  </button>
                  <button onClick={() => setDeclined(true)} style={{ flex: '1 1 240px', cursor: 'pointer', textAlign: 'center', background: 'transparent', border: '3px solid #fff', borderRadius: 14, padding: '15px 16px', fontFamily: 'var(--f-mono)', fontWeight: 700, fontSize: 14, color: '#fff' }}>
                    No thanks, I enjoy losing money
                  </button>
                </div>
              )}
            </>
          )}
        </Band>

        {/* C — watch chad work / your ad is ready + tweet + feed (dark) */}
        <Band bg="var(--bg)">
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 30, color: tweetId ? 'var(--green)' : '#fff' }}>{tweetId ? 'YOUR AD IS READY 🎉' : 'WATCH CHAD WORK'}</div>
          {tweetId ? (
            // ready → the live public reply on the left, the finished drop-in Meta ad rendered on the right
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ flex: '1 1 300px', minWidth: 0, borderRadius: 16, border: '2px solid #1c241c', background: '#0f140f', overflow: 'hidden', padding: 8 }}>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: '#5f6b5f', padding: '2px 4px 6px' }}>live on X ↓</div>
                <blockquote className="twitter-tweet" data-theme="dark" data-conversation="none" data-align="center">
                  <a href={fix.tweetUrl!}>Your fixed ad →</a>
                </blockquote>
              </div>
              <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: '#5f6b5f', padding: '2px 4px 6px' }}>your drop-in Meta ad ↓</div>
                <MetaAd name={fix.name || name} body={fix.body} headline={fix.headline} cta={fix.cta} creative={fix.image} />
              </div>
            </div>
          ) : (
            <div style={{ borderRadius: 16, border: '2px solid #1c241c', background: '#0f140f', overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '34px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 26 }}>⏳</div>
                <div style={{ fontFamily: 'var(--f-sans)', fontWeight: 700, fontSize: 15, color: '#cfe8d6' }}>The link to your ad will appear here when ready.</div>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: '#5f6b5f' }}>usually ~2 minutes — Chad&apos;s on it 👇</div>
              </div>
            </div>
          )}
          <LiveFeed max={12} />
        </Band>

        {/* D — the dead ad, all the way at the bottom (yellow) */}
        <Band bg="var(--yellow)" last>
          <div style={{ fontFamily: 'var(--f-marker)', fontSize: 18, color: 'var(--ink)', transform: 'rotate(-1.5deg)' }}>the one I&apos;m replacing 👇</div>
          <div style={{ position: 'relative', width: '100%', maxWidth: 360, margin: '0 auto' }}>
            <div style={{ filter: 'grayscale(1) contrast(.95) brightness(.93)', background: '#fff', borderRadius: 12, overflow: 'hidden', border: '3px solid var(--ink)', boxShadow: '6px 6px 0 var(--ink)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#ff2d6f,#ffe600)', flex: 'none' }} />
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#222' }}>{name}</div>
                  <div style={{ fontSize: 11, color: '#8a8d91' }}>your old ad</div>
                </div>
              </div>
              <Creative url={creative} />
            </div>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', top: '50%', left: '-3%', width: '106%', height: 16, background: '#ff1414', transform: 'translateY(-50%) rotate(26deg)', boxShadow: '0 0 0 3px #fff' }} />
              <div style={{ position: 'absolute', top: '50%', left: '-3%', width: '106%', height: 16, background: '#ff1414', transform: 'translateY(-50%) rotate(-26deg)', boxShadow: '0 0 0 3px #fff' }} />
            </div>
            <div style={{ position: 'absolute', top: -18, right: -6, transform: 'rotate(8deg)', fontFamily: 'var(--f-marker)', color: '#ff1414', fontSize: 26 }}>RIP 🪦</div>
          </div>
        </Band>
      </div>
    </Shell>
  )
}

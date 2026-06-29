'use client'

import { useEffect, useState, type ReactNode } from 'react'
import LiveFeed from '../../LiveFeed'

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

// The real ad rendered as a faux sponsored post — no marker scribbles (we let the verdict do the talking).
function AdCard({ name, copy, creative, controls = false }: { name: string; copy?: string | null; creative?: string | null; controls?: boolean }) {
  return (
    <div style={{ transform: 'rotate(-1.5deg)' }}>
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '3px solid var(--ink)', boxShadow: '6px 6px 0 var(--ink)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#cfd3d8,#e9ebee)', flex: 'none' }} />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#222' }}>{name}</div>
            <div style={{ fontSize: 11, color: '#8a8d91' }}>Sponsored · 🌐</div>
          </div>
        </div>
        {copy && <div style={{ padding: '0 12px 10px', fontSize: 12.5, color: '#222' }}>{copy}</div>}
        <Creative url={creative} controls={controls} />
      </div>
    </div>
  )
}

export default function Funnel({ data, paid, id }: { data: any; paid: boolean; id: string }) {
  // If they're back from Stripe (?paid=1), drop them straight on the celebration screen.
  const [step, setStep] = useState<Step>(paid ? 'done' : 'roast')
  const [bump, setBump] = useState(false)

  const score: number | null = data.score ?? null
  const scoreStr = score != null ? `${score}/100` : 'unscored'
  const name: string = data.name || 'this brand'
  const creative: string | null = data.ad?.creative_url ?? null
  const roast: string | null = data.roast_text ?? null

  const tier = bump ? 12 : 5
  const checkoutHref = `/api/checkout?p=${encodeURIComponent(id)}&tier=${tier}`

  // Thank-you page state: the $49 upsell decline + this order's fix status (polled → swaps the placeholder for the tweet).
  const [declined, setDeclined] = useState(false)
  const [fix, setFix] = useState<{ delivered: boolean; tweetUrl?: string | null; image?: string | null }>({ delivered: false })
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
                <AdCard name={name} copy={data.ad?.copy} creative={creative} controls />
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

  // ============================ PAYWALL ============================
  if (step === 'paywall') {
    return (
      <Shell>
        <Marquee color="var(--yellow)" seconds={12} text=" THE FIX ● I ALREADY FIXED IT ● UNLOCK $5 ● NEW HEADLINE + CREATIVE ● " />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ ...PAGE, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 0' }}>
            <button onClick={() => setStep('roast')} style={{ border: 0, background: 'none', cursor: 'pointer', fontFamily: 'var(--f-mono)', fontSize: 12, color: '#04210d', fontWeight: 700 }}>‹ back to roast</button>
            <div style={{ fontFamily: 'var(--f-heavy)', fontSize: 13, color: '#0a5c22' }}>ADCHAD</div>
          </div>

          <div style={{ ...PAGE, padding: '12px 20px 28px' }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 50, lineHeight: 0.9, color: 'var(--ink)' }}>
              I ALREADY <span style={{ background: 'var(--yellow)', padding: '0 8px', border: '3px solid var(--ink)', boxShadow: '4px 4px 0 var(--ink)' }}>FIXED IT.</span>
            </div>

            {/* before → after — FULL WIDTH, the centerpiece */}
            <div style={{ marginTop: 24, display: 'flex', alignItems: 'stretch', gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0, opacity: 0.85 }}>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: '#7a6c00', marginBottom: 6 }}>YOURS · {score != null ? score : '??'}</div>
                <div style={{ border: '2px solid var(--ink)', borderRadius: 10, height: 'clamp(150px, 34vw, 330px)', overflow: 'hidden', background: '#fff' }}><Creative url={creative} /></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'var(--f-bungee)', color: 'var(--ink)', fontSize: 22 }}>→</div>
              <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: '#1f9c3a', marginBottom: 6 }}>THE FIX · 🔒</div>
                <div style={{ position: 'relative', border: '2px solid var(--ink)', borderRadius: 10, height: 'clamp(150px, 34vw, 330px)', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, filter: 'blur(11px)' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 70% 25%, #ffd36e, transparent 55%), linear-gradient(150deg,#13131a 0%,#3a0f24 50%,#ff2d6f 120%)' }} />
                    <div style={{ position: 'absolute', right: '-8%', bottom: '-12%', width: '46%', height: '64%', borderRadius: '50% 50% 44% 44%', background: 'linear-gradient(160deg,#f6c89a,#caa074)' }} />
                    <div style={{ position: 'absolute', left: '6%', top: '10%', width: '22%', height: 9, borderRadius: 4, background: 'var(--yellow)' }} />
                    <div style={{ position: 'absolute', left: '6%', top: '20%', width: '46%', height: 14, borderRadius: 3, background: '#fff' }} />
                    <div style={{ position: 'absolute', left: '6%', top: '32%', width: '36%', height: 14, borderRadius: 3, background: '#fff' }} />
                    <div style={{ position: 'absolute', left: '6%', bottom: '10%', width: '40%', height: 18, borderRadius: 8, background: 'var(--green)' }} />
                  </div>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <div style={{ fontSize: 30 }}>🔒</div>
                    <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: '#fff', background: 'var(--ink)', padding: '4px 10px', borderRadius: 20 }}>unlock for $5</div>
                  </div>
                </div>
              </div>
            </div>

            {/* what you get → the A/B bump sits RIGHT UNDER the value props (never a separate column) */}
            <div style={{ marginTop: 26, maxWidth: 560 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, alignItems: 'flex-start' }}>
                <div style={{ transform: 'rotate(-1.5deg)', background: 'var(--yellow)', border: '3px solid var(--ink)', boxShadow: '3px 3px 0 var(--ink)', padding: '7px 11px', fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>✓ new headline, body &amp; CTA</div>
                <div style={{ transform: 'rotate(1deg)', background: '#fff', border: '3px solid var(--ink)', boxShadow: '3px 3px 0 var(--pink)', padding: '7px 11px', fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>✓ a ready-to-use HD generated ad image</div>
                <div style={{ transform: 'rotate(-1deg)', background: 'var(--pink)', border: '3px solid var(--ink)', boxShadow: '3px 3px 0 var(--ink)', padding: '7px 11px', fontWeight: 700, fontSize: 13, color: '#fff' }}>✓ ready in ~2 minutes</div>
              </div>
              <button onClick={() => setBump((b) => !b)} style={{ width: '100%', textAlign: 'left', marginTop: 16, cursor: 'pointer', border: '2px dashed var(--ink)', borderRadius: 12, padding: 14, display: 'flex', gap: 11, alignItems: 'center', background: '#fff19a' }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, border: '2px solid var(--ink)', flex: 'none', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {bump && <span style={{ color: '#1f9c3a', fontWeight: 900, fontSize: 17 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--f-heavy)', fontSize: 13, color: 'var(--ink)' }}>Add 2 MORE to A/B test <span style={{ color: '#1f9c3a' }}>+$7</span></div>
                  <div style={{ fontSize: 11, color: '#6b6e00' }}>3 images total. Find your winner faster.</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <CtaBar as="a" href={checkoutHref}>
          <div style={{ background: 'var(--yellow)', border: '4px solid #fff', borderRadius: 14, padding: 14, textAlign: 'center', boxShadow: '0 0 0 4px var(--ink)', transform: 'rotate(-1deg)', animation: 'throb 2.4s ease-in-out infinite' }}>
            <span style={{ fontFamily: 'var(--f-bungee)', fontSize: 23, color: 'var(--ink)' }}>TAKE MY ${tier}</span>
          </div>
        </CtaBar>
      </Shell>
    )
  }

  // ============================ DONE (paid=1) ============================
  const upsellHref = `/api/checkout?p=${encodeURIComponent(id)}&tier=49`
  return (
    <Shell>
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--yellow)' }}>

        {/* A — payment + upsell video (green) */}
        <Band bg="var(--green)">
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 40, lineHeight: 0.9, color: 'var(--ink)' }}>PAYMENT RECEIVED.</div>
          <video
            src="https://teaser-page-virid.vercel.app/adchad-upsell.mp4"
            controls autoPlay muted playsInline
            style={{ width: '100%', display: 'block', borderRadius: 14, border: '3px solid var(--ink)', boxShadow: '6px 6px 0 var(--ink)', background: '#000' }}
          />
        </Band>

        {/* B — the pitch + Yes/No (pink) */}
        <Band bg="var(--pink)">
          <div style={{ fontFamily: 'var(--f-heavy)', fontSize: 19, lineHeight: 1.2, color: '#fff' }}>
            By the time you finish watching this video, your ad will be ready.
          </div>
          {declined ? (
            <a href={upsellHref} style={{ fontFamily: 'var(--f-mono)', fontSize: 13, fontWeight: 700, color: '#fff' }}>
              💀 enjoy the losses — changed your mind? Hire Chad, $49/mo →
            </a>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <a href={upsellHref} style={{ flex: '1 1 240px', textAlign: 'center', background: 'var(--yellow)', border: '4px solid var(--ink)', borderRadius: 14, padding: '15px 16px', boxShadow: '4px 4px 0 var(--ink)', fontFamily: 'var(--f-bungee)', fontSize: 17, color: 'var(--ink)' }}>
                Hire Chad now for $49/mo
              </a>
              <button onClick={() => setDeclined(true)} style={{ flex: '1 1 240px', cursor: 'pointer', textAlign: 'center', background: 'transparent', border: '3px solid #fff', borderRadius: 14, padding: '15px 16px', fontFamily: 'var(--f-mono)', fontWeight: 700, fontSize: 14, color: '#fff' }}>
                No thanks, I enjoy losing money
              </button>
            </div>
          )}
        </Band>

        {/* C — watch chad work / your ad is ready + tweet + feed (dark) */}
        <Band bg="var(--bg)">
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 30, color: tweetId ? 'var(--green)' : '#fff' }}>{tweetId ? 'YOUR AD IS READY 🎉' : 'WATCH CHAD WORK'}</div>
          <div style={{ borderRadius: 16, border: '2px solid #1c241c', background: '#0f140f', overflow: 'hidden' }}>
            {tweetId ? (
              <div style={{ padding: 8 }}>
                <blockquote className="twitter-tweet" data-theme="dark" data-conversation="none" data-align="center">
                  <a href={fix.tweetUrl!}>Your fixed ad →</a>
                </blockquote>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '34px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 26 }}>⏳</div>
                <div style={{ fontFamily: 'var(--f-sans)', fontWeight: 700, fontSize: 15, color: '#cfe8d6' }}>The link to your ad will appear here when ready.</div>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: '#5f6b5f' }}>usually ~2 minutes — Chad&apos;s on it 👇</div>
              </div>
            )}
          </div>
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

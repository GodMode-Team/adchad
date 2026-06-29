'use client'

import { useState, type ReactNode } from 'react'

type Step = 'roast' | 'paywall' | 'done'

const isVideo = (u?: string | null) => !!u && /\.(mp4|webm|mov)$/i.test(u)

// Layout: green fills the full page; content lives in a max-width container that goes 2-column on wide screens
// (flex-wrap → stacks on mobile, exactly like the homepage). All in globals.css `.fnl-shell`.
function Shell({ children }: { children: ReactNode }) {
  return <main className="fnl-shell">{children}</main>
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
function CtaBar({ children, as = 'div', href, onClick }: { children: ReactNode; as?: 'a' | 'div'; href?: string; onClick?: () => void }) {
  const inner = <div style={{ maxWidth: 520, margin: '0 auto' }}>{children}</div>
  const style = { flex: 'none', display: 'block', width: '100%', border: 0, background: 'var(--ink)', padding: '16px 20px', cursor: 'pointer', position: 'sticky', bottom: 0, zIndex: 5 } as const
  return as === 'a' ? <a href={href} style={style}>{inner}</a> : <button onClick={onClick} style={style}>{inner}</button>
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

  // ============================ ROAST ============================
  if (step === 'roast') {
    return (
      <Shell>
        <Marquee color="var(--pink)" text={` EXHIBIT A ● I PULLED ${name.toUpperCase()}'S LIVE AD ● IT'S BAD ● ${scoreStr} ● `} />
        <div style={{ flex: 1, padding: '30px 20px 34px' }}>
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

                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 2 }}>
                  <img src="/chad-cutout.png" alt="" style={{ width: 96, flex: 'none', transformOrigin: 'bottom center', animation: 'wobble 3.2s ease-in-out infinite' }} />
                  <div style={{ fontFamily: 'var(--f-marker)', color: 'var(--ink)', fontSize: 18, transform: 'rotate(-3deg)', paddingBottom: 18 }}>I already wrote<br />the good one →</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CtaBar onClick={() => setStep('paywall')}>
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
  return (
    <Shell>
      <div style={{ height: 44, flex: 'none', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--f-bungee)', fontSize: 18, color: 'var(--yellow)' }}>FIX DEPLOYED 💪</div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '30px 20px 36px' }}>
        <div style={PAGE}>
          <div style={ROW}>
            {/* LEFT — the receipt */}
            <div style={{ ...COL }}>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 48, lineHeight: 0.92, color: 'var(--ink)' }}>PAYMENT<br />RECEIVED.</div>
              <div style={{ marginTop: 12, fontSize: 16, lineHeight: 1.45, fontWeight: 600, color: '#04210d' }}>
                Your fix is generating right now — you&apos;ll have it in ~2 minutes: a fresh headline, body, CTA and a ready-to-run ad creative.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 0' }}>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: '#0a3d16' }}>score</div>
                <div style={{ fontFamily: 'var(--f-heavy)', fontSize: 15, color: '#0a3d16', textDecoration: 'line-through', opacity: 0.6 }}>{score != null ? score : '??'}</div>
                <div style={{ fontFamily: 'var(--f-bungee)', color: 'var(--ink)' }}>→</div>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>your fix is cooking…</div>
              </div>
              {/* watch the order get worked on, live */}
              <a href="https://adchad.ai/live" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginTop: 22, background: 'var(--ink)', border: '3px solid var(--green)', borderRadius: 12, padding: '12px 16px', boxShadow: '4px 4px 0 var(--green)' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5a5a', flex: 'none', animation: 'livedot 1.2s ease-in-out infinite' }} />
                <span style={{ fontFamily: 'var(--f-bungee)', fontSize: 14, color: 'var(--yellow)' }}>WATCH CHAD BUILD IT — LIVE →</span>
              </a>
            </div>

            {/* RIGHT — their OLD ad, marked for death */}
            <div style={{ ...COL }}>
              <div style={{ position: 'relative' }}>
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
                {/* big red X — outside the grayscale filter so it stays vivid */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '-3%', width: '106%', height: 16, background: '#ff1414', transform: 'translateY(-50%) rotate(26deg)', boxShadow: '0 0 0 3px #fff' }} />
                  <div style={{ position: 'absolute', top: '50%', left: '-3%', width: '106%', height: 16, background: '#ff1414', transform: 'translateY(-50%) rotate(-26deg)', boxShadow: '0 0 0 3px #fff' }} />
                </div>
                <div style={{ position: 'absolute', top: -18, right: -6, transform: 'rotate(8deg)', fontFamily: 'var(--f-marker)', color: '#ff1414', fontSize: 26 }}>RIP 🪦</div>
              </div>
            </div>
          </div>

          {/* $49/mo upsell — full width under the columns */}
          <a href={`/api/checkout?p=${encodeURIComponent(id)}&tier=49`} style={{ display: 'flex', marginTop: 22, background: 'var(--ink)', borderRadius: 14, padding: '14px 15px', alignItems: 'center', gap: 12 }}>
            <img src="/chad-cutout.png" alt="" style={{ width: 62, flex: 'none', transformOrigin: 'bottom center', animation: 'bounce 1.6s ease-in-out infinite' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--f-heavy)', fontSize: 14, color: '#fff', lineHeight: 1.05 }}>Want a fresh one every week?</div>
              <div style={{ fontSize: 11, color: '#9aa0a6', marginTop: 2 }}>New creative + I watch your competitors. <b style={{ color: 'var(--green)' }}>$49/mo.</b></div>
            </div>
            <div style={{ fontFamily: 'var(--f-bungee)', color: 'var(--yellow)', fontSize: 20 }}>→</div>
          </a>
        </div>
      </div>
      <a href="/work" style={{ flex: 'none', padding: '13px 20px', background: 'var(--ink)', textAlign: 'center', fontFamily: 'var(--f-mono)', fontSize: 12, color: '#9aa0a6' }}>see the rest of the work →</a>
    </Shell>
  )
}

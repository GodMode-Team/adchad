import { run } from '../tools/db'
import RoastModal from './RoastModal'
import Halls from './Halls'

export const dynamic = 'force-dynamic'

// brand tokens (design system - globals.css)
const INK = 'var(--ink)', GREEN = 'var(--green)', PINK = 'var(--pink)', YELLOW = 'var(--yellow)', BG = 'var(--bg)'
const F_DISPLAY = 'var(--f-display)', F_HEAVY = 'var(--f-heavy)', F_BUNGEE = 'var(--f-bungee)', F_MARKER = 'var(--f-marker)', F_MONO = 'var(--f-mono)', F_SANS = 'var(--f-sans)'

const tick = ' YOUR ADS ARE DOGSHIT ● I\'M JACKED AND I\'M RIGHT ● YOUR CTR IS A CRY FOR HELP ● YOUR AGENCY ROBBED YOU BLIND ●'
const wrap = { maxWidth: 1200, margin: '0 auto' } as const

export default async function Home() {
  const m: any = await run('metrics', {}).catch(() => ({}))
  const l: any = await run('ledger', {}).catch(() => ({}))
  const halls: any = await run('halls', {}).catch(() => ({ shame: [], fame: [] }))

  // the "WATCH ME RUN THE BUSINESS" counters - REAL values, never the mockup's fakes
  const counters: [string, string, string][] = [
    [Number(m.prospects ?? 0).toLocaleString(), 'ADS SCANNED', '#fff'],
    [Number(m.roasted ?? 0).toLocaleString(), 'ROASTS POSTED', PINK],
    [Number(m.orders_paid ?? 0).toLocaleString(), 'FIXES SOLD', GREEN],
    [`$${((l.margin_cents ?? 0) / 100).toFixed(2)}`, 'MARGIN TODAY', YELLOW],
  ]

  return (
    <div style={{ background: BG, overflowX: 'hidden' }}>
      <style>{`
        .ac-link{transition:color .12s ease}
        .ac-link:hover{color:#fff}
        .ac-nav-cta{transition:all .12s ease}
        .ac-nav-cta:hover{background:var(--yellow);box-shadow:1px 1px 0 var(--ink);transform:translate(2px,2px)}
        .ac-price-cta{transition:background .12s ease}
        .ac-price-cta:hover{background:var(--pink)}
        .ac-live-cta{transition:all .12s ease}
        .ac-live-cta:hover{background:var(--pink);color:#fff}
        .ac-final-cta{transition:background .12s ease}
        .ac-final-cta:hover{background:var(--green)}
        .ac-foot-link{transition:color .12s ease}
        .ac-foot-link:hover{color:#fff}
        .nav-chad{animation:navbob 2.6s ease-in-out infinite;transform-origin:50% 92%}
        .nav-logo:hover .nav-chad{animation-duration:.5s}
        @keyframes navbob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-3px) rotate(3deg)}}
      `}</style>

      {/* ===== TOP TICKER ===== */}
      <div style={{ height: 38, background: PINK, borderBottom: `3px solid ${INK}`, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', whiteSpace: 'nowrap', fontFamily: F_BUNGEE, fontSize: 14, color: INK, animation: 'mq 60s linear infinite' }}>
          <span>{tick.repeat(4)}</span><span>{tick.repeat(4)}</span>
        </div>
      </div>

      {/* ===== NAV ===== */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: BG, borderBottom: '2px solid var(--line)' }}>
        <div style={{ ...wrap, padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 18 }}>
          <div className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <img className="nav-chad" src="/chad-cutout.png" alt="" style={{ height: 38, width: 'auto', filter: 'drop-shadow(0 3px 4px rgba(0,0,0,.45))' }} />
            <span style={{ fontFamily: F_HEAVY, fontSize: 24, letterSpacing: -1, color: '#fff' }}>ADCHAD</span>
          </div>
          <div style={{ display: 'flex', gap: 22, marginLeft: 14 }}>
            <a className="ac-link" href="#how" style={{ fontFamily: F_MONO, fontSize: 13, color: '#9fb0a0' }}>how it works</a>
            <a className="ac-link" href="#fame" style={{ fontFamily: F_MONO, fontSize: 13, color: '#9fb0a0' }}>hall of fame</a>
            <a className="ac-link" href="/live" style={{ fontFamily: F_MONO, fontSize: 13, color: '#9fb0a0' }}>live feed</a>
          </div>
          <a className="ac-nav-cta" href="#hero" style={{ marginLeft: 'auto', fontFamily: F_BUNGEE, fontSize: 14, color: INK, background: GREEN, border: '3px solid #fff', boxShadow: `3px 3px 0 ${INK}`, padding: '8px 16px' }}>GET ROASTED</a>
        </div>
      </div>

      {/* ===== HERO ===== */}
      <div id="hero" style={{ background: YELLOW, borderBottom: `4px solid ${INK}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 880, margin: '0 auto', padding: 'clamp(22px,3vw,38px) 22px clamp(30px,4vw,48px)', textAlign: 'center' }}>
          <div style={{ fontFamily: F_DISPLAY, fontSize: 'clamp(44px,8.5vw,84px)', lineHeight: 0.94, color: INK, letterSpacing: -1 }}>
            YOUR AD IS <span style={{ color: '#fff', WebkitTextStroke: `3px ${INK}`, textShadow: `5px 5px 0 ${PINK}` }}>COOKED.</span>
          </div>
          <div style={{ fontFamily: F_SANS, fontSize: 'clamp(15px,1.9vw,17px)', color: INK, fontWeight: 500, margin: '12px auto 0', maxWidth: 660, lineHeight: 1.45 }}>
            I&apos;m an AI that&apos;s seen ten thousand bad ads — and yours is one of them. I roast it in public, then unfuck it for $5.
          </div>

          {/* THE FEATURE — Chad's 2-minute roast reel, now the biggest thing on screen */}
          <div style={{ position: 'relative', maxWidth: 780, margin: 'clamp(18px,2.6vw,26px) auto 0' }}>
            <video
              controls
              playsInline
              preload="metadata"
              poster="https://teaser-page-virid.vercel.app/poster.jpg"
              style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', background: '#000', border: `4px solid ${INK}`, borderRadius: 14, boxShadow: `8px 8px 0 ${INK}` }}
            >
              <source src="https://teaser-page-virid.vercel.app/adchad-2min.mp4" type="video/mp4" />
            </video>
          </div>

          {/* ONE CTA — opens the drop-your-ad modal */}
          <div style={{ marginTop: 'clamp(20px,3vw,30px)' }}>
            <RoastModal />
          </div>
          <div style={{ marginTop: 16, fontFamily: F_MARKER, fontSize: 19, color: INK, transform: 'rotate(-1deg)' }}>Real roasts. Real fixes. Running right now.</div>
        </div>
      </div>

      {/* ===== PROOF ===== */}
      <div style={{ background: BG, borderBottom: `4px solid ${INK}` }}>
        <div style={{ ...wrap, padding: '64px 22px', display: 'flex', gap: 44, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <div style={{ fontFamily: F_DISPLAY, fontSize: 54, lineHeight: 0.92, color: '#fff', marginTop: 10 }}>I PULL YOUR<br />LIVE AD AND<br /><span style={{ color: YELLOW }}>MARK IT UP.</span></div>
            <div style={{ fontFamily: F_SANS, fontSize: 16, color: '#9fb0a0', marginTop: 16, maxWidth: 440 }}>No survey. No call. I scan thousands of live ads, score the creative 0 to 100, and the worst ones get roasted in public. Then I sell you the fix.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
              <div style={{ background: 'var(--card)', border: '1.5px solid var(--line)', borderLeft: `4px solid ${PINK}`, borderRadius: 10, padding: '9px 13px', fontFamily: F_SANS, fontSize: 13, color: '#e3e5e9' }}><b>Vague hook:</b> &quot;We Do Botox &amp; More!&quot;</div>
              <div style={{ background: 'var(--card)', border: '1.5px solid var(--line)', borderLeft: `4px solid ${YELLOW}`, borderRadius: 10, padding: '9px 13px', fontFamily: F_SANS, fontSize: 13, color: '#e3e5e9' }}><b>Dead CTA:</b> &quot;Learn More&quot;</div>
              <div style={{ background: 'var(--card)', border: '1.5px solid var(--line)', borderLeft: `4px solid ${GREEN}`, borderRadius: 10, padding: '9px 13px', fontFamily: F_SANS, fontSize: 13, color: '#e3e5e9' }}><b>247 days:</b> same stale creative</div>
            </div>
          </div>
          <div style={{ flex: 'none', width: 330, position: 'relative' }}>
            <div style={{ position: 'relative', transform: 'rotate(-3deg)' }}>
              {/* an illustrative example - a marked-up fake FB ad */}
              <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 16px 34px rgba(0,0,0,.5)', border: `2px solid ${INK}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 13px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'repeating-linear-gradient(45deg,#e9ebee,#e9ebee 6px,#dfe2e6 6px,#dfe2e6 12px)' }} />
                  <div style={{ lineHeight: 1.2 }}><div style={{ fontWeight: 700, fontSize: 13, color: '#222' }}>Bella Vista Med Spa</div><div style={{ fontSize: 11, color: '#8a8d91' }}>Sponsored · 🌐</div></div>
                </div>
                <div style={{ padding: '0 13px 10px', fontSize: 13, color: '#222' }}>✨We Do Botox &amp; More!✨ Call us TODAY!!! 💉🔥</div>
                <img src="/medspa-stock.png" alt="" style={{ display: 'block', width: '100%', height: 150, objectFit: 'cover', objectPosition: 'center 35%' }} />
                <div style={{ background: '#f0f2f5', padding: '11px 13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ lineHeight: 1.25 }}><div style={{ fontSize: 10, color: '#8a8d91', letterSpacing: 0.5 }}>BELLAVISTAMEDSPA.COM</div><div style={{ fontWeight: 700, fontSize: 13, color: '#222' }}>We Do Botox &amp; More!</div></div>
                  <div style={{ background: '#dadde1', color: '#222', fontSize: 12, fontWeight: 600, padding: '7px 12px', borderRadius: 6 }}>Learn More</div>
                </div>
              </div>
              <div style={{ position: 'absolute', top: 118, right: -12, fontFamily: F_MARKER, color: '#ff1414', fontSize: 18, transform: 'rotate(8deg)' }}>$0 results 💀</div>
              <div style={{ position: 'absolute', bottom: 34, left: -16, fontFamily: F_MARKER, color: '#ff1414', fontSize: 17, transform: 'rotate(-6deg)' }}>&quot;learn what?&quot;</div>
            </div>
            <img src="/chad-cutout.png" alt="" style={{ position: 'absolute', bottom: -46, right: -40, width: 120, filter: 'drop-shadow(0 8px 8px rgba(0,0,0,.4))' }} />
          </div>
        </div>
      </div>

      {/* ===== HOW IT WORKS ===== */}
      <div id="how" style={{ background: YELLOW, borderBottom: `4px solid ${INK}` }}>
        <div style={{ ...wrap, padding: '60px 22px' }}>
          <div style={{ fontFamily: F_DISPLAY, fontSize: 50, color: INK, lineHeight: 0.9 }}>FOUR STEPS. <span style={{ background: INK, color: YELLOW, padding: '0 10px' }}>ZERO HUMANS.</span></div>
          <div style={{ display: 'flex', gap: 16, marginTop: 30, flexWrap: 'wrap' }}>
            {([
              ['🔍', '01', 'SCAN', 'I pull thousands of live ads and trace every one back to a real business.', '#fff', INK, '#e7e0c0', '#444'],
              ['📊', '02', 'SCORE', 'Graded 0 to 100 on badness, economics, and safety. Only the ones that earn it get roasted.', '#fff', INK, '#e7e0c0', '#444'],
              ['🔥', '03', 'ROAST', 'Savage and actually useful. Auto-posted to X and emailed to the owner.', PINK, '#fff', '#ff79a6', '#ffe0ec'],
              ['✅', '04', 'FIX', 'Pay $5 → a rewritten ad + a real generated HD image lands in your inbox in 60 seconds.', GREEN, '#04210d', '#9af0a8', '#0a3d16'],
            ] as [string, string, string, string, string, string, string, string][]).map(([emoji, n, title, body, bg, titleColor, numColor, bodyColor]) => (
              <div key={n} style={{ flex: 1, minWidth: 220, background: bg, border: `4px solid ${INK}`, boxShadow: `6px 6px 0 ${INK}`, borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><div style={{ fontSize: 34 }}>{emoji}</div><div style={{ fontFamily: F_DISPLAY, fontSize: 34, color: numColor }}>{n}</div></div>
                <div style={{ fontFamily: F_HEAVY, fontSize: 20, color: titleColor, marginTop: 8 }}>{title}</div>
                <div style={{ fontFamily: F_SANS, fontSize: 13.5, color: bodyColor, marginTop: 6, lineHeight: 1.4 }}>{body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== WATCH ME RUN THE BUSINESS ===== */}
      <div style={{ background: GREEN, borderBottom: `4px solid ${INK}` }}>
        <div style={{ ...wrap, padding: '54px 22px', display: 'flex', alignItems: 'center', gap: 30, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <div style={{ fontFamily: F_DISPLAY, fontSize: 54, color: INK, lineHeight: 0.9 }}>WATCH ME RUN<br />THE BUSINESS.</div>
            <div style={{ fontFamily: F_SANS, fontSize: 16, color: '#0a3d16', marginTop: 14, maxWidth: 430 }}>Every scan, roast, sale, and fix. Streaming in public with a live P&amp;L.</div>
            <a className="ac-live-cta" href="/live" style={{ display: 'inline-block', marginTop: 20, fontFamily: F_BUNGEE, fontSize: 16, color: GREEN, background: INK, border: '3px solid #fff', boxShadow: `4px 4px 0 ${INK}`, padding: '12px 20px' }}>OPEN THE LIVE FEED →</a>
          </div>
          <div style={{ flex: 'none', width: 330, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {counters.map(([value, label, color]) => (
              <div key={label} style={{ flex: 1, minWidth: 150, background: INK, borderRadius: 14, padding: 16 }}>
                <div style={{ fontFamily: F_BUNGEE, fontSize: 26, color }}>{value}</div>
                <div style={{ fontFamily: F_MONO, fontSize: 10, color: '#6f7d6f', letterSpacing: 1, marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== HALL OF SHAME + HALL OF FAME (live tweet embeds) ===== */}
      <Halls shame={halls.shame ?? []} fame={halls.fame ?? []} />

      {/* ===== CHAD ON RETAINER ($49/mo) ===== */}
      <div style={{ background: INK, borderBottom: `4px solid ${INK}` }}>
        <div style={{ ...wrap, padding: '60px 22px', display: 'flex', gap: 34, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <div style={{ display: 'inline-block', transform: 'rotate(-2deg)', background: GREEN, color: INK, fontFamily: F_MONO, fontWeight: 700, fontSize: 12, letterSpacing: 1, padding: '5px 12px', marginBottom: 16 }}>{"FOR WHEN ONE FIX ISN'T ENOUGH"}</div>
            <div style={{ fontFamily: F_DISPLAY, fontSize: 54, color: '#fff', lineHeight: 0.9 }}>CHAD ON <span style={{ color: GREEN }}>RETAINER.</span></div>
            <div style={{ fontFamily: F_SANS, fontSize: 16, color: '#9fb0a0', marginTop: 12, maxWidth: 430 }}>I don&apos;t hand you weekly creative. I watch your money — and your competitors.</div>
          </div>
          <div style={{ flex: 'none', width: 360, background: 'var(--card)', border: '4px solid #fff', boxShadow: `7px 7px 0 ${GREEN}`, borderRadius: 16, padding: 22 }}>
            <div style={{ fontFamily: F_BUNGEE, fontSize: 40, color: '#fff' }}>$49<span style={{ fontFamily: F_MONO, fontSize: 14, color: '#9fb0a0' }}>/mo</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
              {([
                ['🛡️', 'Spend protection', 'I watch your ads so you stop lighting money on fire.'],
                ['🔭', 'Competitor intel', 'Who you’re up against, and exactly where they’re weak.'],
                ['💰', 'Money saved', 'Monthly receipts on what I kept in your pocket.'],
              ] as [string, string, string][]).map(([icon, t, d]) => (
                <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18, lineHeight: 1.2 }}>{icon}</span>
                  <div style={{ fontFamily: F_SANS, fontSize: 13.5, lineHeight: 1.35 }}><b style={{ color: '#fff' }}>{t}</b> <span style={{ color: '#9fb0a0' }}>{d}</span></div>
                </div>
              ))}
            </div>
            <a className="ac-price-cta" href="/api/checkout?tier=49" style={{ display: 'block', textAlign: 'center', marginTop: 18, fontFamily: F_BUNGEE, fontSize: 16, color: INK, background: GREEN, border: '3px solid #fff', boxShadow: `4px 4px 0 ${INK}`, padding: '13px 18px' }}>PUT CHAD ON RETAINER →</a>
          </div>
        </div>
      </div>

      {/* ===== FINAL CTA ===== */}
      <div style={{ background: PINK, borderBottom: `4px solid ${INK}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ ...wrap, padding: '70px 22px', textAlign: 'center', position: 'relative' }}>
          <div style={{ fontFamily: F_DISPLAY, fontSize: 74, color: INK, lineHeight: 0.86 }}>DON&apos;T MAKE ME<br />FIND YOU <span style={{ color: '#fff', WebkitTextStroke: `2px ${INK}` }}>FIRST.</span></div>
          <div style={{ fontFamily: F_SANS, fontSize: 17, color: '#3a0011', marginTop: 16, fontWeight: 500 }}>Roast yourself before the agent does it in public.</div>
          <a className="ac-final-cta" href="#hero" style={{ display: 'inline-block', marginTop: 26, fontFamily: F_BUNGEE, fontSize: 20, color: INK, background: YELLOW, border: '4px solid #fff', boxShadow: `6px 6px 0 ${INK}`, padding: '16px 28px', animation: 'throb 2.4s ease-in-out infinite' }}>ROAST MY ADS → FREE</a>
          <img src="/chad-cutout.png" alt="" style={{ position: 'absolute', bottom: -30, right: 8, width: 128, transform: 'scaleX(-1)', filter: 'drop-shadow(0 8px 10px rgba(0,0,0,.3))' }} />
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div style={{ background: BG }}>
        <div style={{ ...wrap, padding: '40px 22px 50px' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontFamily: F_HEAVY, fontSize: 22, color: '#fff' }}>ADCHAD</div>
              <div style={{ fontFamily: F_MONO, fontSize: 12, color: '#5f6b5f', marginTop: 8, maxWidth: 360 }}>An AI ad agency that hunts down garbage ads, drags them in public for sport, then sells the $5 fix. Run a weak one and you&apos;re next.</div>
            </div>
            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: F_MONO, fontSize: 11, color: '#39443a', letterSpacing: 1, marginBottom: 9 }}>PRODUCT</div>
                <a className="ac-foot-link" href="#how" style={{ display: 'block', fontFamily: F_SANS, fontSize: 13, color: '#9fb0a0', marginBottom: 6 }}>How it works</a>
                <a className="ac-foot-link" href="/live" style={{ display: 'block', fontFamily: F_SANS, fontSize: 13, color: '#9fb0a0' }}>Live feed</a>
              </div>
              <div>
                <div style={{ fontFamily: F_MONO, fontSize: 11, color: '#39443a', letterSpacing: 1, marginBottom: 9 }}>FOLLOW</div>
                <a className="ac-foot-link" href="https://x.com/adchadofficial" target="_blank" rel="noreferrer" style={{ display: 'block', fontFamily: F_SANS, fontSize: 13, color: '#9fb0a0', marginBottom: 6 }}>@adchadofficial</a>
                <a className="ac-foot-link" href="#hero" style={{ display: 'block', fontFamily: F_SANS, fontSize: 13, color: '#9fb0a0' }}>Get the $5 fix</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

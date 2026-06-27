import { run } from '../tools/db'
import RoastBox from './RoastBox'

export const dynamic = 'force-dynamic'

// brand tokens (design system — globals.css)
const INK = 'var(--ink)', GREEN = 'var(--green)', PINK = 'var(--pink)', YELLOW = 'var(--yellow)', BG = 'var(--bg)'
const F_DISPLAY = 'var(--f-display)', F_HEAVY = 'var(--f-heavy)', F_BUNGEE = 'var(--f-bungee)', F_MARKER = 'var(--f-marker)', F_MONO = 'var(--f-mono)', F_SANS = 'var(--f-sans)'

const tick = ' YOUR ADS ARE BAD ● I CAN PROVE IT ● $5 TO UNFUCK THEM ● THE AGENT NEVER SLEEPS ●'
const wrap = { maxWidth: 1200, margin: '0 auto' } as const

export default async function Home() {
  const m: any = await run('metrics', {}).catch(() => ({}))
  const l: any = await run('ledger', {}).catch(() => ({}))

  // the "WATCH ME RUN THE BUSINESS" counters — REAL values, never the mockup's fakes
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
      `}</style>

      {/* ===== TOP TICKER ===== */}
      <div style={{ height: 38, background: PINK, borderBottom: `3px solid ${INK}`, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', whiteSpace: 'nowrap', fontFamily: F_BUNGEE, fontSize: 14, color: INK, animation: 'mq 18s linear infinite' }}>
          <span>{tick.repeat(4)}</span><span>{tick.repeat(4)}</span>
        </div>
      </div>

      {/* ===== NAV ===== */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: BG, borderBottom: '2px solid var(--line)' }}>
        <div style={{ ...wrap, padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ fontFamily: F_HEAVY, fontSize: 24, letterSpacing: -1, color: '#fff' }}>ADCHAD</div>
          <div style={{ display: 'flex', gap: 22, marginLeft: 14 }}>
            <a className="ac-link" href="#how" style={{ fontFamily: F_MONO, fontSize: 13, color: '#9fb0a0' }}>how it works</a>
            <a className="ac-link" href="#pricing" style={{ fontFamily: F_MONO, fontSize: 13, color: '#9fb0a0' }}>pricing</a>
            <a className="ac-link" href="/live" style={{ fontFamily: F_MONO, fontSize: 13, color: '#9fb0a0' }}>live feed</a>
          </div>
          <a className="ac-nav-cta" href="#hero" style={{ marginLeft: 'auto', fontFamily: F_BUNGEE, fontSize: 14, color: INK, background: GREEN, border: '3px solid #fff', boxShadow: `3px 3px 0 ${INK}`, padding: '8px 16px' }}>GET ROASTED</a>
        </div>
      </div>

      {/* ===== HERO ===== */}
      <div id="hero" style={{ background: GREEN, borderBottom: `4px solid ${INK}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ ...wrap, padding: '62px 22px 70px', display: 'flex', gap: 30, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 330 }}>
            <div style={{ display: 'inline-block', transform: 'rotate(-2deg)', background: INK, color: GREEN, fontFamily: F_MONO, fontWeight: 700, fontSize: 12, letterSpacing: 1, padding: '5px 12px', marginBottom: 18 }}>AN AI AD AGENCY THAT PROSPECTS FOR ITSELF</div>
            <div style={{ fontFamily: F_DISPLAY, fontSize: 84, lineHeight: 0.86, color: INK, letterSpacing: -1 }}>
              YOUR META ADS<br />ARE <span style={{ color: '#fff', WebkitTextStroke: `3px ${INK}`, textShadow: `5px 5px 0 ${PINK}` }}>COOKED.</span>
            </div>
            <div style={{ fontFamily: F_SANS, fontSize: 18, color: '#0a3d16', fontWeight: 500, marginTop: 18, maxWidth: 480 }}>
              I find small businesses running weak ads, roast them in public, then sell the fix for $5. You&apos;re probably one of them. Let&apos;s find out.
            </div>
            <RoastBox />
          </div>
          <div style={{ flex: 'none', width: 300, position: 'relative', alignSelf: 'stretch', minHeight: 340 }}>
            <img src="/chad-cutout.png" alt="Chad, the AI ad agency mascot" style={{ position: 'absolute', bottom: -70, left: '50%', transform: 'translateX(-50%)', width: 330, animation: 'bounce 1.8s ease-in-out infinite', filter: 'drop-shadow(0 14px 14px rgba(0,0,0,.3))' }} />
            <div style={{ position: 'absolute', top: 10, right: -6, transform: 'rotate(9deg)', background: INK, color: YELLOW, fontFamily: F_BUNGEE, fontSize: 14, padding: '7px 11px', boxShadow: `4px 4px 0 ${PINK}`, animation: 'floaty 4s ease-in-out infinite' }}>23/100<br /><span style={{ fontSize: 9, color: '#fff' }}>avg. before me</span></div>
            <div style={{ position: 'absolute', bottom: 90, left: -18, transform: 'rotate(-8deg)', background: YELLOW, color: INK, fontFamily: F_MARKER, fontSize: 18, padding: '6px 12px', border: `3px solid ${INK}` }}>caught in 4k 📸</div>
          </div>
        </div>
      </div>

      {/* ===== PROOF / EXHIBIT A ===== */}
      <div style={{ background: BG, borderBottom: `4px solid ${INK}` }}>
        <div style={{ ...wrap, padding: '64px 22px', display: 'flex', gap: 44, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <div style={{ fontFamily: F_MONO, fontSize: 12, color: PINK, fontWeight: 700, letterSpacing: 2 }}>EXHIBIT A</div>
            <div style={{ fontFamily: F_DISPLAY, fontSize: 54, lineHeight: 0.92, color: '#fff', marginTop: 10 }}>I PULL YOUR<br />LIVE AD AND<br /><span style={{ color: YELLOW }}>MARK IT UP.</span></div>
            <div style={{ fontFamily: F_SANS, fontSize: 16, color: '#9fb0a0', marginTop: 16, maxWidth: 440 }}>No survey. No discovery call. I scan thousands of real Meta ads, grade the creative 0–100, and the genuinely bad ones get a public, itemized roast — then the fix.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
              <div style={{ background: 'var(--card)', border: '1.5px solid var(--line)', borderLeft: `4px solid ${PINK}`, borderRadius: 10, padding: '9px 13px', fontFamily: F_SANS, fontSize: 13, color: '#e3e5e9' }}><b>Vague hook</b> — &quot;We Do Botox &amp; More!&quot;</div>
              <div style={{ background: 'var(--card)', border: '1.5px solid var(--line)', borderLeft: `4px solid ${YELLOW}`, borderRadius: 10, padding: '9px 13px', fontFamily: F_SANS, fontSize: 13, color: '#e3e5e9' }}><b>Dead CTA</b> — &quot;Learn More&quot;</div>
              <div style={{ background: 'var(--card)', border: '1.5px solid var(--line)', borderLeft: `4px solid ${GREEN}`, borderRadius: 10, padding: '9px 13px', fontFamily: F_SANS, fontSize: 13, color: '#e3e5e9' }}><b>247 days</b> — same stale creative</div>
            </div>
          </div>
          <div style={{ flex: 'none', width: 330, position: 'relative' }}>
            <div style={{ position: 'relative', transform: 'rotate(-3deg)' }}>
              {/* an illustrative example — a marked-up fake FB ad */}
              <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 16px 34px rgba(0,0,0,.5)', border: `2px solid ${INK}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 13px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'repeating-linear-gradient(45deg,#e9ebee,#e9ebee 6px,#dfe2e6 6px,#dfe2e6 12px)' }} />
                  <div style={{ lineHeight: 1.2 }}><div style={{ fontWeight: 700, fontSize: 13, color: '#222' }}>Bella Vista Med Spa</div><div style={{ fontSize: 11, color: '#8a8d91' }}>Sponsored · 🌐</div></div>
                </div>
                <div style={{ padding: '0 13px 10px', fontSize: 13, color: '#222' }}>✨We Do Botox &amp; More!✨ Call us TODAY!!! 💉🔥</div>
                <div style={{ height: 150, background: 'repeating-linear-gradient(45deg,#e9ebee,#e9ebee 11px,#dfe2e6 11px,#dfe2e6 22px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: F_MONO, fontSize: 10, color: '#9aa0a6', background: '#ffffff88', padding: '3px 8px', borderRadius: 4 }}>stock photo · woman touching face</span></div>
                <div style={{ background: '#f0f2f5', padding: '11px 13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ lineHeight: 1.25 }}><div style={{ fontSize: 10, color: '#8a8d91', letterSpacing: 0.5 }}>BELLAVISTAMEDSPA.COM</div><div style={{ fontWeight: 700, fontSize: 13, color: '#222' }}>We Do Botox &amp; More!</div></div>
                  <div style={{ background: '#dadde1', color: '#222', fontSize: 12, fontWeight: 600, padding: '7px 12px', borderRadius: 6 }}>Learn More</div>
                </div>
              </div>
              <div style={{ position: 'absolute', top: 118, right: -12, fontFamily: F_MARKER, color: '#ff1414', fontSize: 18, transform: 'rotate(8deg)' }}>$0 results 💀</div>
              <div style={{ position: 'absolute', bottom: 34, left: -16, fontFamily: F_MARKER, color: '#ff1414', fontSize: 17, transform: 'rotate(-6deg)' }}>&quot;learn what?&quot;</div>
            </div>
            <img src="/chad-cutout.png" alt="" style={{ position: 'absolute', bottom: -46, right: -40, width: 120, animation: 'wobble 2.6s ease-in-out infinite', filter: 'drop-shadow(0 8px 8px rgba(0,0,0,.4))' }} />
          </div>
        </div>
      </div>

      {/* ===== HOW IT WORKS ===== */}
      <div id="how" style={{ background: YELLOW, borderBottom: `4px solid ${INK}` }}>
        <div style={{ ...wrap, padding: '60px 22px' }}>
          <div style={{ fontFamily: F_DISPLAY, fontSize: 50, color: INK, lineHeight: 0.9 }}>FOUR STEPS. <span style={{ background: INK, color: YELLOW, padding: '0 10px' }}>ZERO HUMANS.</span></div>
          <div style={{ fontFamily: F_MONO, fontSize: 13, color: '#7a6c00', marginTop: 10 }}>the autonomous loop — it runs itself, end to end.</div>
          <div style={{ display: 'flex', gap: 16, marginTop: 30, flexWrap: 'wrap' }}>
            {([
              ['🔍', '01', 'SCAN', 'I pull thousands of live Meta ads via Foreplay — every one links back to a real business.', '#fff', INK, '#e7e0c0', '#444'],
              ['📊', '02', 'SCORE', 'Graded 0–100 on badness, economics, and safety. Only ones that earn it get roasted.', '#fff', INK, '#e7e0c0', '#444'],
              ['🔥', '03', 'ROAST', 'Savage and genuinely useful. Auto-posted to X and emailed to the owner with the offer.', PINK, '#fff', '#ff79a6', '#ffe0ec'],
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

      {/* ===== PRICING ===== */}
      <div id="pricing" style={{ background: BG, borderBottom: `4px solid ${INK}` }}>
        <div style={{ ...wrap, padding: '62px 22px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: F_DISPLAY, fontSize: 52, color: '#fff', lineHeight: 0.9 }}>PICK YOUR <span style={{ color: PINK }}>PAIN LEVEL.</span></div>
            <div style={{ fontFamily: F_MONO, fontSize: 13, color: '#5f6b5f', marginTop: 10 }}>the roast is always free. the fix is where I make rent.</div>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 34, flexWrap: 'wrap', alignItems: 'stretch' }}>
            {/* FREE */}
            <div style={{ flex: 1, minWidth: 230, background: 'var(--card)', border: '3px solid var(--line)', borderRadius: 18, padding: 22 }}>
              <div style={{ fontFamily: F_MONO, fontSize: 12, color: '#9fb0a0', letterSpacing: 1 }}>FREE</div>
              <div style={{ fontFamily: F_DISPLAY, fontSize: 44, color: '#fff', lineHeight: 1 }}>$0</div>
              <div style={{ fontFamily: F_SANS, fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>The public roast — diagnosis + one hook idea.</div>
              <div style={{ height: 1.5, background: 'var(--line)', margin: '16px 0' }} />
              <div style={{ fontFamily: F_SANS, fontSize: 13, color: '#cfd6cf', lineHeight: 1.9 }}>✓ Creative score 0–100<br />✓ What&apos;s broken &amp; why<br />✓ One better hook</div>
            </div>
            {/* SINGLE FIX — $5 → #hero (roast first, we need a prospect id before checkout) */}
            <div style={{ flex: 1.15, minWidth: 240, background: GREEN, border: '4px solid #fff', boxShadow: `8px 8px 0 ${INK}`, borderRadius: 18, padding: 22, position: 'relative' }}>
              <div style={{ position: 'absolute', top: -15, right: 16, transform: 'rotate(5deg)', background: PINK, color: '#fff', fontFamily: F_BUNGEE, fontSize: 12, padding: '5px 11px', border: `3px solid ${INK}` }}>DOOR-BUSTER</div>
              <div style={{ fontFamily: F_MONO, fontSize: 12, color: '#04210d', letterSpacing: 1, fontWeight: 700 }}>SINGLE FIX</div>
              <div style={{ fontFamily: F_DISPLAY, fontSize: 44, color: INK, lineHeight: 1 }}>$5</div>
              <div style={{ fontFamily: F_SANS, fontSize: 13, color: '#0a3d16', marginTop: 6 }}>A rewrite + one real HD ad image to run.</div>
              <div style={{ height: 2, background: '#0a3d1633', margin: '16px 0' }} />
              <div style={{ fontFamily: F_SANS, fontSize: 13, color: '#0a3d16', lineHeight: 1.9, fontWeight: 500 }}>✓ New headline, body &amp; CTA<br />✓ A generated static ad<br />✓ In your inbox in 60s</div>
              <a className="ac-price-cta" href="#hero" style={{ display: 'block', textAlign: 'center', marginTop: 18, fontFamily: F_BUNGEE, fontSize: 15, color: '#fff', background: INK, padding: 11, borderRadius: 10 }}>UNFUCK ONE AD →</a>
            </div>
            {/* 3-VARIANT PACK */}
            <div style={{ flex: 1, minWidth: 230, background: 'var(--card)', border: '3px solid var(--line)', borderRadius: 18, padding: 22 }}>
              <div style={{ fontFamily: F_MONO, fontSize: 12, color: YELLOW, letterSpacing: 1 }}>3-VARIANT PACK</div>
              <div style={{ fontFamily: F_DISPLAY, fontSize: 44, color: '#fff', lineHeight: 1 }}>$12</div>
              <div style={{ fontFamily: F_SANS, fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>Three generated ads to A/B test.</div>
              <div style={{ height: 1.5, background: 'var(--line)', margin: '16px 0' }} />
              <div style={{ fontFamily: F_SANS, fontSize: 13, color: '#cfd6cf', lineHeight: 1.9 }}>✓ Everything in $5<br />✓ 3 images total<br />✓ Find your winner faster</div>
            </div>
            {/* SUBSCRIPTION */}
            <div style={{ flex: 1, minWidth: 230, background: '#1a0f14', border: '3px solid #4a1f29', borderRadius: 18, padding: 22 }}>
              <div style={{ fontFamily: F_MONO, fontSize: 12, color: '#ff79a6', letterSpacing: 1 }}>SUBSCRIPTION</div>
              <div style={{ fontFamily: F_DISPLAY, fontSize: 44, color: '#fff', lineHeight: 1 }}>$49<span style={{ fontSize: 16, color: '#ff79a6' }}>/mo</span></div>
              <div style={{ fontFamily: F_SANS, fontSize: 13, color: '#c79aa8', marginTop: 6 }}>Fresh creative weekly + I watch your competitors.</div>
              <div style={{ height: 1.5, background: '#4a1f29', margin: '16px 0' }} />
              <div style={{ fontFamily: F_SANS, fontSize: 13, color: '#e7cdd6', lineHeight: 1.9 }}>✓ Weekly new ads<br />✓ Competitor monitoring<br />✓ Never go stale again</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== WATCH ME RUN THE BUSINESS ===== */}
      <div style={{ background: GREEN, borderBottom: `4px solid ${INK}` }}>
        <div style={{ ...wrap, padding: '54px 22px', display: 'flex', alignItems: 'center', gap: 30, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: INK, borderRadius: 20, padding: '5px 13px', marginBottom: 14 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN, animation: 'blink 1.1s steps(1) infinite' }} />
              <span style={{ fontFamily: F_MONO, fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: 1 }}>RUNNING RIGHT NOW</span>
            </div>
            <div style={{ fontFamily: F_DISPLAY, fontSize: 54, color: INK, lineHeight: 0.9 }}>WATCH ME RUN<br />THE BUSINESS.</div>
            <div style={{ fontFamily: F_SANS, fontSize: 16, color: '#0a3d16', marginTop: 14, maxWidth: 430 }}>Every scan, roast, sale and fix — streaming in public, with a live P&amp;L. No dashboard login. Nothing to hide.</div>
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

      {/* ===== FINAL CTA ===== */}
      <div style={{ background: PINK, borderBottom: `4px solid ${INK}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ ...wrap, padding: '70px 22px', textAlign: 'center', position: 'relative' }}>
          <div style={{ fontFamily: F_DISPLAY, fontSize: 74, color: INK, lineHeight: 0.86 }}>DON&apos;T MAKE ME<br />FIND YOU <span style={{ color: '#fff', WebkitTextStroke: `2px ${INK}` }}>FIRST.</span></div>
          <div style={{ fontFamily: F_SANS, fontSize: 17, color: '#3a0011', marginTop: 16, fontWeight: 500 }}>Roast yourself before the agent does it in public. It&apos;s free, and it stings less.</div>
          <a className="ac-final-cta" href="#hero" style={{ display: 'inline-block', marginTop: 26, fontFamily: F_BUNGEE, fontSize: 20, color: INK, background: YELLOW, border: '4px solid #fff', boxShadow: `6px 6px 0 ${INK}`, padding: '16px 28px', animation: 'throb 2.4s ease-in-out infinite' }}>ROAST MY ADS → FREE</a>
          <img src="/chad-cutout.png" alt="" style={{ position: 'absolute', bottom: -30, right: 8, width: 128, transform: 'scaleX(-1)', animation: 'wobble 2.8s ease-in-out infinite', filter: 'drop-shadow(0 8px 10px rgba(0,0,0,.3))' }} />
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div style={{ background: BG }}>
        <div style={{ ...wrap, padding: '40px 22px 50px' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontFamily: F_HEAVY, fontSize: 22, color: '#fff' }}>ADCHAD</div>
              <div style={{ fontFamily: F_MONO, fontSize: 12, color: '#5f6b5f', marginTop: 8, maxWidth: 360 }}>An AI ad agency that prospects for itself. I roast ads, not people — every target passes a brand-safety gate before a word goes out.</div>
            </div>
            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: F_MONO, fontSize: 11, color: '#39443a', letterSpacing: 1, marginBottom: 9 }}>PRODUCT</div>
                <a className="ac-foot-link" href="#how" style={{ display: 'block', fontFamily: F_SANS, fontSize: 13, color: '#9fb0a0', marginBottom: 6 }}>How it works</a>
                <a className="ac-foot-link" href="#pricing" style={{ display: 'block', fontFamily: F_SANS, fontSize: 13, color: '#9fb0a0', marginBottom: 6 }}>Pricing</a>
                <a className="ac-foot-link" href="/live" style={{ display: 'block', fontFamily: F_SANS, fontSize: 13, color: '#9fb0a0' }}>Live feed</a>
              </div>
              <div>
                <div style={{ fontFamily: F_MONO, fontSize: 11, color: '#39443a', letterSpacing: 1, marginBottom: 9 }}>FOLLOW</div>
                <a className="ac-foot-link" href="https://x.com/adchadofficial" target="_blank" rel="noreferrer" style={{ display: 'block', fontFamily: F_SANS, fontSize: 13, color: '#9fb0a0', marginBottom: 6 }}>@adchadofficial</a>
                <a className="ac-foot-link" href="#pricing" style={{ display: 'block', fontFamily: F_SANS, fontSize: 13, color: '#9fb0a0' }}>Get the $5 fix</a>
              </div>
            </div>
          </div>
          <div style={{ height: 1.5, background: 'var(--line)', margin: '26px 0 16px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontFamily: F_MONO, fontSize: 10, color: '#39443a' }}>© 2026 AdChad · 1100 Roast Ave, Tempe AZ 85281 · roast in public · unsubscribe anytime</div>
            <div style={{ fontFamily: F_MONO, fontSize: 10, color: '#39443a' }}>built by an agent, not a vibe</div>
          </div>
        </div>
      </div>
    </div>
  )
}

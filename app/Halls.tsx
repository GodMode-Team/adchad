'use client'
import { useEffect } from 'react'

type Shame = { tweetId: string; score: number | null }
type Fame = { tweetUrl: string }

function TweetCard({ url, theme, chip, chipBg, chipColor }: { url: string; theme: 'dark' | 'light'; chip: string; chipBg: string; chipColor: string }) {
  return (
    <div style={{ flex: '1 1 320px', minWidth: 300, maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ fontFamily: 'var(--f-bungee)', fontSize: 12, padding: '4px 12px', background: chipBg, color: chipColor, border: '2px solid #111', borderRadius: 20 }}>{chip}</div>
      <div style={{ width: '100%' }}>
        <blockquote className="twitter-tweet" data-theme={theme} data-conversation="none" data-align="center"><a href={url}>{' '}</a></blockquote>
      </div>
    </div>
  )
}

// Hall of Shame (worst roasts) + Hall of Fame (the fixes), embedded as LIVE tweets. Tweet URLs are SSR'd by the
// home page (run('halls')); we just load X's widget once to hydrate the blockquotes into real tweet cards.
export default function Halls({ shame, fame }: { shame: Shame[]; fame: Fame[] }) {
  useEffect(() => {
    if (!shame.length && !fame.length) return
    const w = window as any
    if (w.twttr?.widgets) { w.twttr.widgets.load(); return }
    const s = document.createElement('script')
    s.src = 'https://platform.twitter.com/widgets.js'
    s.async = true
    s.onload = () => w.twttr?.widgets?.load?.()
    document.body.appendChild(s)
  }, [shame, fame])

  const xurl = (id: string) => `https://x.com/adchadofficial/status/${id}`

  return (
    <>
      {/* ===== HALL OF SHAME ===== */}
      <div id="shame" style={{ background: '#0a0c0a', borderBottom: '4px solid #111' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '62px 22px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-block', transform: 'rotate(-2deg)', background: '#ff2d6f', color: '#fff', fontFamily: 'var(--f-bungee)', fontSize: 13, padding: '5px 14px', border: '3px solid #111' }}>💀 HALL OF SHAME</div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 52, color: '#fff', lineHeight: 0.9, marginTop: 14 }}>THE WORST ADS<br />I&apos;VE EVER <span style={{ color: '#ff2d6f' }}>SEEN.</span></div>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: 13, color: '#5f6b5f', marginTop: 10 }}>lowest scores on record. roasted in public. no mercy.</div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 34, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'center' }}>
            {shame.length === 0
              ? <div style={{ fontFamily: 'var(--f-mono)', fontSize: 13, color: '#5f6b5f', padding: 30 }}>the carnage loads here…</div>
              : shame.map((t) => <TweetCard key={t.tweetId} url={xurl(t.tweetId)} theme="dark" chip={t.score != null ? `${t.score}/100` : 'ROASTED'} chipBg="#ff2d6f" chipColor="#fff" />)}
          </div>
        </div>
      </div>

      {/* ===== HALL OF FAME ===== */}
      <div id="fame" style={{ background: '#ffe600', borderBottom: '4px solid #111' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '62px 22px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-block', transform: 'rotate(2deg)', background: '#111', color: '#ffe600', fontFamily: 'var(--f-bungee)', fontSize: 13, padding: '5px 14px', border: '3px solid #fff', boxShadow: '3px 3px 0 #111' }}>🏆 HALL OF FAME</div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 52, color: '#111', lineHeight: 0.9, marginTop: 14 }}>AND THE ONES I<br /><span style={{ background: '#3ce84a', padding: '0 10px', border: '3px solid #111' }}>FIXED CLEAN.</span></div>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: 13, color: '#7a6c00', marginTop: 10 }}>same businesses, after the $5 fix. highest scores on record.</div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 34, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'center' }}>
            {fame.length === 0
              ? <div style={{ fontFamily: 'var(--f-mono)', fontSize: 13, color: '#7a6c00', padding: 30 }}>the comeback stories load here…</div>
              : fame.map((t, i) => <TweetCard key={i} url={t.tweetUrl} theme="light" chip="FIXED ✓" chipBg="#3ce84a" chipColor="#04210d" />)}
          </div>
        </div>
      </div>
    </>
  )
}

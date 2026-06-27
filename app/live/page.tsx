'use client'
import { useEffect, useState } from 'react'

// Real feed shape (see tools/db.ts `feed` op). PII is stripped server-side; this is a pure read view.
type Ev = {
  ts: string
  kind: 'prospect' | 'roast' | 'reply' | 'email' | 'fix' | 'money'
  icon: string
  title: string
  detail?: string
  link?: string
  image?: string
  score?: number
}
type Stats = {
  prospects?: number
  roasted?: number
  contacted?: number
  replied?: number
  customers?: number
  orders_paid?: number
  revenue_cents?: number
  cost_cents?: number
  margin_cents?: number
}

const money = (c?: number) => `$${((c ?? 0) / 100).toFixed(2)}`

const ago = (ts: string) => {
  const s = Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 1000))
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// kind → left-border / icon-tile accent. money splits on direction (+ = revenue green, − = spend red).
const accentFor = (e: Ev): string => {
  switch (e.kind) {
    case 'prospect': return '#ffe600'
    case 'roast': return '#ff2d6f'
    case 'reply': return '#ffe600'
    case 'email': return '#3ce84a'
    case 'fix': return '#3ce84a'
    case 'money': return e.title.startsWith('+') ? '#3ce84a' : '#ff5a7a'
    default: return '#3ce84a'
  }
}

// Public "watch AdChad work" feed — polls /api/feed every 5s. No auth. Restyled to the neo-brutalist mockup.
export default function Live() {
  const [events, setEvents] = useState<Ev[]>([])
  const [stats, setStats] = useState<Stats>({})

  useEffect(() => {
    let on = true
    const pull = async () => {
      try {
        const r = await fetch('/api/feed', { cache: 'no-store' })
        const d = await r.json()
        if (!on) return
        setEvents(Array.isArray(d.events) ? d.events : [])
        setStats(d.stats || {})
      } catch {
        // keep last good state on a transient fetch error
      }
    }
    pull()
    const id = setInterval(pull, 5000)
    return () => { on = false; clearInterval(id) }
  }, [])

  const pnl = [
    { label: 'REVENUE', value: money(stats.revenue_cents), bg: '#0a1f10', border: '#1c3f25', labelColor: '#4f9a63', valueColor: '#3ce84a', flex: 1 },
    { label: 'SPEND', value: `−${money(stats.cost_cents)}`, bg: '#220f14', border: '#4a1f29', labelColor: '#c4607a', valueColor: '#ff5a7a', flex: 1 },
    { label: 'MARGIN', value: money(stats.margin_cents), bg: '#211d05', border: '#4a4313', labelColor: '#b8a23a', valueColor: '#ffe600', flex: 1.15 },
  ]

  const counters = [
    { label: 'SCANNED', value: (stats.prospects ?? 0).toLocaleString(), color: '#fff' },
    { label: 'ROASTS', value: String(stats.roasted ?? 0), color: '#ff2d6f' },
    { label: 'SALES', value: String(stats.orders_paid ?? 0), color: '#3ce84a' },
  ]

  return (
    <div style={{ minHeight: '100vh', width: '100%', background: 'radial-gradient(circle at 50% -8%, #16271b, #0a0c0a 68%)', display: 'flex', justifyContent: 'center', padding: '14px 12px 60px', fontFamily: 'var(--f-sans)' }}>
      <div style={{ width: '100%', maxWidth: 474, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ===== HEADER ===== */}
        <div style={{ border: '2px solid #1f2a1f', borderRadius: 20, overflow: 'hidden', background: '#0f140f' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 10px' }}>
            <div style={{ fontFamily: 'var(--f-heavy)', fontSize: 24, letterSpacing: '-1px', color: '#fff' }}>ADCHAD</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/chad-cutout.png" alt="" style={{ marginLeft: 'auto', width: 42, transformOrigin: 'bottom center', animation: 'work 1s ease-in-out infinite' }} />
          </div>
          <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: '#5f6b5f', padding: '0 16px' }}>
            watching <span style={{ color: '#9fb0a0' }}>@adchadofficial</span> run the business — unattended.
          </div>

          {/* P&L tiles */}
          <div style={{ display: 'flex', gap: 8, padding: '14px 16px 12px' }}>
            {pnl.map((t) => (
              <div key={t.label} style={{ flex: t.flex, background: t.bg, border: `1.5px solid ${t.border}`, borderRadius: 13, padding: '10px 11px' }}>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: 9, color: t.labelColor, letterSpacing: 1 }}>{t.label}</div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 27, color: t.valueColor, lineHeight: 1.05 }}>{t.value}</div>
              </div>
            ))}
          </div>

          {/* counters */}
          <div style={{ display: 'flex', gap: 8, padding: '0 16px 14px' }}>
            {counters.map((c) => (
              <div key={c.label} style={{ flex: 1, textAlign: 'center', background: '#0c110c', border: '1.5px solid #1f2a1f', borderRadius: 11, padding: '8px 4px' }}>
                <div style={{ fontFamily: 'var(--f-bungee)', fontSize: 18, color: c.color, lineHeight: 1 }}>{c.value}</div>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: 9, color: '#5f6b5f', letterSpacing: '.5px', marginTop: 3 }}>{c.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== FEED LABEL ===== */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 4px' }}>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 12, fontWeight: 700, color: '#9fb0a0', letterSpacing: 1 }}>LIVE FEED</span>
        </div>

        {/* ===== EMPTY ===== */}
        {events.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#5f6b5f', fontFamily: 'var(--f-mono)', fontSize: 13 }}>AdChad is warming up…</div>
        )}

        {/* ===== TIMELINE ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {events.map((e, i) => {
            const accent = accentFor(e)
            const isLatest = i === 0
            const scoreTxt = e.score != null ? `score ${e.score}/100` : ''
            const detail = [e.detail, scoreTxt].filter(Boolean).join(' · ')
            return (
              <div
                key={`${e.ts}-${i}`}
                style={{
                  display: 'flex',
                  gap: 11,
                  padding: '12px 13px',
                  border: '1.5px solid #1c241c',
                  borderLeft: `5px solid ${accent}`,
                  borderRadius: 14,
                  background: '#10130f',
                  boxShadow: isLatest ? `0 0 0 1.5px ${accent}66, 0 8px 26px rgba(0,0,0,.45)` : '0 2px 8px rgba(0,0,0,.3)',
                }}
              >
                <div style={{ width: 40, height: 40, flex: 'none', borderRadius: 11, border: '2px solid #000', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>{e.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ fontFamily: 'var(--f-sans)', fontWeight: 700, fontSize: 14, color: '#f1f5f0', lineHeight: 1.15 }}>{e.title}</div>
                    {isLatest && (
                      <span style={{ fontFamily: 'var(--f-mono)', fontSize: 8, fontWeight: 700, color: '#0a0c0a', background: '#3ce84a', padding: '2px 5px', borderRadius: 20, letterSpacing: '.5px', animation: 'blink 1.2s steps(1) infinite' }}>NEW</span>
                    )}
                  </div>
                  {detail && <div style={{ fontFamily: 'var(--f-sans)', fontSize: 12.5, color: '#8a9088', lineHeight: 1.35, marginTop: 3 }}>{detail}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                    <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: '#56624f' }}>{ago(e.ts)}</span>
                    {e.link && <a href={e.link} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--f-mono)', fontSize: 10, fontWeight: 700, color: '#ff2d6f' }}>view on X ↗</a>}
                  </div>
                </div>
                {e.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.image} alt="" style={{ width: 54, height: 54, flex: 'none', borderRadius: 9, border: '2px solid #000', objectFit: 'cover' }} />
                )}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}

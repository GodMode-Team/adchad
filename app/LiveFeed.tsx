'use client'
import { useEffect, useState } from 'react'

export type Ev = {
  ts: string
  kind: 'prospect' | 'roast' | 'reply' | 'email' | 'fix' | 'money' | 'paid'
  icon: string
  title: string
  detail?: string
  link?: string
  image?: string
  score?: number
}

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
    case 'paid': return '#ffe600' // payment in, fix generating — "working" yellow
    case 'email': return '#3ce84a'
    case 'fix': return '#3ce84a'
    case 'money': return e.title.startsWith('+') ? '#3ce84a' : '#ff5a7a'
    default: return '#3ce84a'
  }
}

// Polls /api/feed every 5s and renders the activity timeline. Shared by /live (full page) and the thank-you page
// (embedded under "WATCH CHAD WORK"). `onData` bubbles the raw payload so a host can read stats without re-fetching.
export default function LiveFeed({ max = 50, onData }: { max?: number; onData?: (d: any) => void }) {
  const [events, setEvents] = useState<Ev[]>([])

  useEffect(() => {
    let on = true
    const pull = async () => {
      try {
        const r = await fetch('/api/feed', { cache: 'no-store' })
        const d = await r.json()
        if (!on) return
        setEvents(Array.isArray(d.events) ? d.events : [])
        onData?.(d)
      } catch { /* keep last good state on a transient fetch error */ }
    }
    pull()
    const id = setInterval(pull, 5000)
    return () => { on = false; clearInterval(id) }
  }, [onData])

  if (events.length === 0)
    return <div style={{ textAlign: 'center', padding: '40px 20px', color: '#5f6b5f', fontFamily: 'var(--f-mono)', fontSize: 13 }}>AdChad is warming up…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {events.slice(0, max).map((e, i) => {
        const accent = accentFor(e)
        const isLatest = i === 0
        const scoreTxt = e.score != null ? `score ${e.score}/100` : ''
        const detail = [e.detail, scoreTxt].filter(Boolean).join(' · ')
        return (
          <div key={`${e.ts}-${i}`} style={{ display: 'flex', gap: 11, padding: '12px 13px', border: '1.5px solid #1c241c', borderLeft: `5px solid ${accent}`, borderRadius: 14, background: '#10130f', boxShadow: isLatest ? `0 0 0 1.5px ${accent}66, 0 8px 26px rgba(0,0,0,.45)` : '0 2px 8px rgba(0,0,0,.3)' }}>
            <div style={{ width: 40, height: 40, flex: 'none', borderRadius: 11, border: '2px solid #000', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>{e.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ fontFamily: 'var(--f-sans)', fontWeight: 700, fontSize: 14, color: '#f1f5f0', lineHeight: 1.15 }}>{e.title}</div>
                {isLatest && <span style={{ fontFamily: 'var(--f-mono)', fontSize: 8, fontWeight: 700, color: '#0a0c0a', background: '#3ce84a', padding: '2px 5px', borderRadius: 20, letterSpacing: '.5px', animation: 'blink 1.2s steps(1) infinite' }}>NEW</span>}
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
  )
}

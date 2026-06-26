'use client'
import { useEffect, useState } from 'react'

type Ev = { ts: string; kind: string; icon: string; title: string; detail?: string; link?: string; image?: string }
type Stats = { prospects?: number; roasted?: number; orders_paid?: number; revenue_cents?: number; cost_cents?: number; margin_cents?: number }

const money = (c?: number) => `$${((c ?? 0) / 100).toFixed(2)}`
const ago = (ts: string) => {
  const s = Math.max(0, (Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60) return `${s | 0}s ago`
  if (s < 3600) return `${(s / 60) | 0}m ago`
  if (s < 86400) return `${(s / 3600) | 0}h ago`
  return `${(s / 86400) | 0}d ago`
}

// Public "watch AdChad work" feed — polls /api/feed every 5s. No auth. PII-stripped server-side.
export default function Live() {
  const [events, setEvents] = useState<Ev[]>([])
  const [stats, setStats] = useState<Stats>({})
  const [live, setLive] = useState(false)

  useEffect(() => {
    let on = true
    const pull = async () => {
      try {
        const r = await fetch('/api/feed', { cache: 'no-store' })
        const d = await r.json()
        if (!on) return
        setEvents(Array.isArray(d.events) ? d.events : [])
        setStats(d.stats || {})
        setLive(true)
      } catch {
        if (on) setLive(false)
      }
    }
    pull()
    const id = setInterval(pull, 5000)
    return () => { on = false; clearInterval(id) }
  }, [])

  const counters: [string, string | number][] = [
    ['Prospects', stats.prospects ?? 0],
    ['Roasts', stats.roasted ?? 0],
    ['Sales', stats.orders_paid ?? 0],
    ['Margin', money(stats.margin_cents)],
  ]

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 18px 80px', fontFamily: 'system-ui, sans-serif', background: '#0b0b0c', color: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h1 style={{ fontWeight: 900, fontSize: 30, margin: 0 }}>AdChad — live</h1>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: live ? '#1ed760' : '#888' }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: live ? '#1ed760' : '#555', boxShadow: live ? '0 0 8px #1ed760' : 'none' }} />
          {live ? 'LIVE' : '…'}
        </span>
      </div>
      <p style={{ color: '#888', marginTop: 6 }}>Watch the agent run the business in real time — prospect, roast, sell, fulfill.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, margin: '20px 0 28px' }}>
        {counters.map(([k, v]) => (
          <div key={k} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>{v}</div>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>{k}</div>
          </div>
        ))}
      </div>

      {events.length === 0 && <p style={{ color: '#888' }}>AdChad is warming up…</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {events.map((e, i) => (
          <div key={`${e.ts}-${i}`} style={{ display: 'flex', gap: 12, padding: 14, background: '#0f0f10', border: '1px solid #1a1a1a', borderRadius: 12 }}>
            <div style={{ fontSize: 20, lineHeight: 1 }}>{e.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{e.title}</div>
              {e.detail && <div style={{ color: '#bbb', fontSize: 13, marginTop: 4, lineHeight: 1.4 }}>{e.detail}</div>}
              {e.image && <img src={e.image} alt="" style={{ marginTop: 8, width: '100%', maxWidth: 260, borderRadius: 8, border: '1px solid #222' }} />}
              <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12, color: '#777' }}>
                <span>{ago(e.ts)}</span>
                {e.link && <a href={e.link} target="_blank" rel="noreferrer" style={{ color: '#4ea1ff' }}>view on X →</a>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

'use client'
import { useState } from 'react'
import LiveFeed from '../LiveFeed'

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

// Public "watch AdChad work" feed. The timeline + polling live in <LiveFeed>; this page wraps it with the P&L header.
export default function Live() {
  const [stats, setStats] = useState<Stats>({})

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
      <div className="live-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

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

        {/* ===== TIMELINE ===== */}
        <LiveFeed onData={(d) => setStats(d.stats || {})} />

      </div>
    </div>
  )
}

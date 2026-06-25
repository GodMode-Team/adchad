import { auditData } from '../../lib/audit'

export const dynamic = 'force-dynamic'

const card = { background: '#111110', border: '1px solid #1c1c1c', borderRadius: 14, padding: '18px 20px' } as const

export default async function Audit() {
  const { metrics, roasts, paused } = await auditData()
  const m = metrics
  const stats: [string, string][] = [
    ['Ads scanned', `${m.scanned}`],
    ['Enriched', `${m.enriched}`],
    ['Qualified', `${m.qualified}`],
    ['Posted', `${m.posted}`],
    ['Emailed', `${m.emailed}`],
    ['Revenue', `$${(m.revenue_cents / 100).toFixed(2)}`],
  ]

  return (
    <main className="wrap" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div className="kicker">AdChad · operator</div>
          <h1 style={{ fontSize: 34, fontWeight: 800, margin: '6px 0 0' }}>Live agent audit</h1>
        </div>
        <form action="/api/control" method="post">
          <input type="hidden" name="paused" value={paused ? 'false' : 'true'} />
          <button style={{ background: paused ? '#c6f24a' : '#ff5e1a', color: '#0a0a0a', fontWeight: 800, border: 0, borderRadius: 999, padding: '12px 20px', cursor: 'pointer' }}>
            {paused ? '▶ Resume agent' : '⏸ Pause (kill-switch)'}
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, margin: '24px 0 32px' }}>
        {stats.map(([label, val]) => (
          <div key={label} style={card}>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{val}</div>
            <div style={{ color: '#8a8a82', fontSize: 12, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="kicker" style={{ marginBottom: 10 }}>Every post + the score that approved it</div>
      <div style={{ display: 'grid', gap: 10 }}>
        {roasts.length === 0 && <div style={{ color: '#8a8a82' }}>No roasts yet — run the loop.</div>}
        {roasts.map((r, i) => (
          <div key={i} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <b>{r.name ?? '—'}</b>
              <span style={{ color: '#8a8a82', fontSize: 13 }}>
                seg {r.segment ?? '—'} · {r.gate ?? '—'} {r.total != null ? `(${r.total})` : ''} · {r.status}
              </span>
            </div>
            <div style={{ margin: '8px 0', fontSize: 15 }}>{r.text}</div>
            <div style={{ color: '#8a8a82', fontSize: 12 }}>
              badness {r.badness ?? '—'} · economic {r.economic ?? '—'} · reach/safety {r.reach_safety ?? '—'}
              {r.reason ? ` · "${r.reason}"` : ''}
              {r.post_url ? <> · <a href={r.post_url} style={{ color: '#ff5e1a' }}>tweet ↗</a></> : null}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

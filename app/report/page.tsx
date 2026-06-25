import { run } from '../../tools/db'

export const dynamic = 'force-dynamic'

const money = (c: number) => `$${(c / 100).toFixed(2)}`

// The agent's live numbers — replaces the old operator dashboard. Same source as the `report` skill.
export default async function Report() {
  const m: any = await run('metrics', {}).catch(() => ({}))
  const l: any = await run('ledger', {}).catch(() => ({ revenue_cents: 0, cost_cents: 0, margin_cents: 0 }))
  const Row = ({ k, v }: { k: string; v: any }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
      <span style={{ color: '#666' }}>{k}</span><b>{v}</b>
    </div>
  )
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '48px auto', padding: '0 20px' }}>
      <h1 style={{ marginBottom: 4 }}>AdChad — live</h1>
      <p style={{ color: '#888', marginTop: 0 }}>Autonomous AI micro-agency · mission: $1M ARR</p>
      <h2 style={{ marginTop: 32 }}>Funnel</h2>
      <Row k="Prospects" v={m.prospects ?? 0} />
      <Row k="Roasted" v={m.roasted ?? 0} />
      <Row k="Contacted" v={m.contacted ?? 0} />
      <Row k="Replied" v={m.replied ?? 0} />
      <Row k="Customers" v={m.customers ?? 0} />
      <h2 style={{ marginTop: 32 }}>P&amp;L</h2>
      <Row k="Revenue" v={money(l.revenue_cents ?? 0)} />
      <Row k="Cost" v={money(l.cost_cents ?? 0)} />
      <Row k="Margin" v={money(l.margin_cents ?? 0)} />
    </main>
  )
}

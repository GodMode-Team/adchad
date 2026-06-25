import { sql } from '../lib/db'

export const dynamic = 'force-dynamic'

async function getProspect(id?: string): Promise<{ name: string | null } | null> {
  if (!id) return null
  try {
    const [p] = await sql<{ name: string | null }[]>`select name from prospects where id = ${id} limit 1`
    return p ?? null
  } catch {
    return null
  }
}

export default async function Home({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams
  const prospect = await getProspect(p)
  const who = prospect?.name?.trim()
  const checkout = `/api/checkout?tier=5${p ? `&p=${encodeURIComponent(p)}` : ''}`

  return (
    <main>
      <section className="hero">
        <div className="wrap">
          <div className="kicker">{who ? `We roasted ${who}` : 'The AI ad agency'}</div>
          <h1 className="h1">
            Your ads are <em>bad</em>.<br />We&apos;ll prove it — then fix them.
          </h1>
          <p className="sub">
            AdChad scans Meta ad libraries, roasts the weak ones in public, and rewrites them so they
            actually convert. {who ? `Yours made the list.` : 'Maybe yours is next.'}
          </p>
          <a className="cta" href={checkout}>Fix my ad — $5 →</a>
          <div className="cta-note">Headline, body, CTA + creative direction. Delivered to your inbox in minutes.</div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="label">How it works</div>
          <div className="steps">
            <div className="step"><b>1. We scan</b><p>We pull live Meta ads and score every one for weak hooks, dead CTAs, and wasted spend.</p></div>
            <div className="step"><b>2. We roast</b><p>The worst offenders get a brutal, public takedown on X — funny enough to spread, true enough to sting.</p></div>
            <div className="step"><b>3. We fix</b><p>One click and our AI rewrites the ad properly. You keep the upside; we keep the receipts.</p></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="label">Pricing</div>
          <div className="tiers">
            <div className="tier"><div className="price">$0</div><div className="name">Public roast</div><div className="desc">A free, savage diagnosis of what&apos;s killing your ad.</div></div>
            <div className="tier hot"><div className="price">$5</div><div className="name">Single fix</div><div className="desc">Full rewrite: headline, body, CTA, creative direction.</div></div>
            <div className="tier"><div className="price">$12</div><div className="name">3-variant pack</div><div className="desc">Three angles to A/B test. Find the winner faster.</div></div>
            <div className="tier"><div className="price">$49<span style={{ fontSize: 16 }}>/mo</span></div><div className="name">Always-on</div><div className="desc">Weekly fresh creative + competitor monitoring.</div></div>
          </div>
        </div>
      </section>

      <footer className="foot">
        <div className="wrap">AdChad — an AI agency that prospects for itself. We roast in public so you don&apos;t have to find out the hard way.</div>
      </footer>
    </main>
  )
}

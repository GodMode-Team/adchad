import { run } from '../../../tools/db'

export const dynamic = 'force-dynamic'

const isVideo = (u?: string | null) => !!u && /\.(mp4|webm|mov)$/i.test(u)

// The conversion page: their ad + the roast + one CTA. Mobile-first. Linked from the tweet/email.
export default async function SalesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data: any = await run('page', { id }).catch(() => ({ found: false }))

  const wrap = { maxWidth: 440, margin: '0 auto', padding: '24px 18px 64px', fontFamily: 'system-ui, sans-serif', color: '#f5f5f5', background: '#0b0b0c', minHeight: '100vh' } as const
  if (!data.found) {
    return <main style={wrap}>This roast has moved on. <a href="/" style={{ color: '#e11' }}>AdChad →</a></main>
  }

  const { name, ad, roast_text } = data
  const checkout = `/api/checkout?p=${encodeURIComponent(id)}&tier=5`
  return (
    <main style={wrap}>
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#e11', marginBottom: 8 }}>AdChad roasted you</div>
      <h1 style={{ fontSize: 30, lineHeight: 1.1, margin: '0 0 16px', fontWeight: 900 }}>
        {name ? `${name}, your ad is bad.` : 'Your ad is bad.'}
      </h1>

      {roast_text && (
        <blockquote style={{ margin: '0 0 20px', padding: '14px 16px', background: '#fff', color: '#0a0a0a', borderRadius: 12, fontSize: 17, lineHeight: 1.4, fontWeight: 600 }}>
          {roast_text}
        </blockquote>
      )}

      {ad?.creative_url && (
        <>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #eee', marginBottom: 6 }}>
            {isVideo(ad.creative_url)
              ? <video src={ad.creative_url} controls muted playsInline style={{ width: '100%', display: 'block' }} />
              : <img src={ad.creative_url} alt="your ad" style={{ width: '100%', display: 'block' }} />}
          </div>
          <p style={{ fontSize: 12, color: '#888', margin: '0 0 24px' }}>↑ the ad we&apos;re talking about.</p>
        </>
      )}

      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>We&apos;ll unfuck it.</div>
      <p style={{ fontSize: 15, color: '#bbb', margin: '0 0 20px', lineHeight: 1.45 }}>
        Rewritten headline, body, and CTA + a ready-to-run ad image — built by the same AI that called yours out. In your inbox in minutes.
      </p>

      <a href={checkout} style={{ display: 'block', textAlign: 'center', background: '#e11', color: '#fff', fontWeight: 900, fontSize: 20, padding: 18, borderRadius: 12, textDecoration: 'none', letterSpacing: 0.5 }}>
        UNFUCK IT — $5 →
      </a>
      <p style={{ fontSize: 12, color: '#999', textAlign: 'center', marginTop: 12 }}>One $5 payment. No subscription. 100% AI, delivered in minutes.</p>
    </main>
  )
}

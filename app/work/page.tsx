import { run } from '../../tools/db'

export const dynamic = 'force-dynamic'

const isVideo = (u?: string | null) => !!u && /\.(mp4|webm|mov)$/i.test(u)

const lbl = { fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#e11', marginBottom: 8 } as const
const media = { width: '100%', borderRadius: 10, display: 'block', border: '1px solid #222' } as const

// The case-study feed — every roast as before → roast → after. The demo money-shot.
export default async function Work() {
  const data: any = await run('gallery', {}).catch(() => ({ items: [] }))
  const items: any[] = data.items || []
  return (
    <main style={{ maxWidth: 1040, margin: '0 auto', padding: '40px 20px 80px', fontFamily: 'system-ui, sans-serif', background: '#0b0b0c', color: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ fontWeight: 900, fontSize: 34, margin: 0 }}>AdChad — the work</h1>
      <p style={{ color: '#888', marginTop: 6 }}>Every roast: the original ad → our public takedown → the fixed $5 creative.</p>

      {items.length === 0 && <p style={{ color: '#888', marginTop: 40 }}>No roasts yet — the agent hasn&apos;t shipped one.</p>}

      {items.map((it) => (
        <section key={it.id} style={{ margin: '28px 0', padding: 20, border: '1px solid #1e1e1e', borderRadius: 16, background: '#0f0f10' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 22 }}>{it.name}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'start' }}>
            <div>
              <div style={lbl}>① Original ad</div>
              {it.original
                ? (isVideo(it.original) ? <video src={it.original} controls muted playsInline style={media} /> : <img src={it.original} alt="original ad" style={media} />)
                : <div style={{ color: '#666', fontSize: 13 }}>no creative captured</div>}
            </div>
            <div>
              <div style={lbl}>② The roast</div>
              <blockquote style={{ background: '#fff', color: '#0a0a0a', padding: 14, borderRadius: 10, fontWeight: 600, fontSize: 15, lineHeight: 1.4, margin: 0 }}>{it.roast}</blockquote>
            </div>
            <div>
              <div style={lbl}>③ Fixed ad — $5</div>
              {it.fix_image
                ? <img src={it.fix_image} alt="fixed ad" style={media} />
                : <div style={{ color: '#666', fontSize: 13 }}>not fulfilled yet</div>}
              {it.fix_copy && <pre style={{ whiteSpace: 'pre-wrap', color: '#aaa', fontSize: 12, marginTop: 8, fontFamily: 'system-ui' }}>{it.fix_copy}</pre>}
            </div>
          </div>
        </section>
      ))}
    </main>
  )
}

// A real Meta/Facebook feed ad, rendered in HTML/CSS from the fix's structured fields — profile row, primary text,
// the creative, and the link-card footer with one of Meta's FIXED CTA buttons. No second image to generate: the
// chrome is CSS, fed by data we already store (tools/fix.ts). Used by the Hall of Fame, the paywall, and the
// thank-you page so every ad we show reads as a drop-in Meta ad. Pure presentational — no hooks, no client APIs.
const isVideo = (u?: string | null) => !!u && /\.(mp4|webm|mov)$/i.test(u)

function MetaCreative({ url, controls = false }: { url?: string | null; controls?: boolean }) {
  if (!url) {
    return (
      <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'repeating-linear-gradient(45deg,#e9ebee,#e9ebee 11px,#dfe2e6 11px,#dfe2e6 22px)' }}>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: '#9aa0a6', background: '#fff8', padding: '3px 8px', borderRadius: 4 }}>no creative captured</span>
      </div>
    )
  }
  return isVideo(url)
    ? <video src={url} controls={controls} muted playsInline style={{ width: '100%', display: 'block' }} />
    : <img src={url} alt="ad creative" style={{ width: '100%', display: 'block' }} />
}

export default function MetaAd({
  name, body, headline, cta, creative, controls = false, rotate = 0, domain,
}: {
  name: string
  body?: string | null
  headline?: string | null
  cta?: string | null
  creative?: string | null
  controls?: boolean
  rotate?: number
  domain?: string | null
}) {
  const hasFooter = !!(headline || cta) // a bad ad with no CTA shows no footer; the fix does — the contrast IS the point
  // link-card domain: use a real one if given, else a slug off the business name (matches the site's mock cards) — never "facebook.com"
  const dom = domain || (name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 28) + '.com' : 'your-site.com')
  return (
    <div style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined }}>
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '3px solid var(--ink)', boxShadow: '6px 6px 0 var(--ink)' }}>
        {/* profile row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#cfd3d8,#e9ebee)', flex: 'none' }} />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#222' }}>{name}</div>
            <div style={{ fontSize: 11, color: '#8a8d91' }}>Sponsored · 🌐</div>
          </div>
        </div>
        {/* primary text */}
        {body && <div style={{ padding: '0 12px 10px', fontSize: 12.5, color: '#222', lineHeight: 1.35 }}>{body}</div>}
        {/* the creative */}
        <MetaCreative url={creative} controls={controls} />
        {/* link-card footer — domain · headline · the real Meta CTA button (grey pill, right-aligned) */}
        {hasFooter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f0f2f5', borderTop: '1px solid #dadde1' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10.5, color: '#8a8d91', textTransform: 'uppercase', letterSpacing: 0.3 }}>{dom}</div>
              {headline && (
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1c1e21', lineHeight: 1.25, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{headline}</div>
              )}
            </div>
            {cta && <div style={{ flex: 'none', background: '#e4e6eb', color: '#050505', fontWeight: 600, fontSize: 12.5, padding: '7px 12px', borderRadius: 6, whiteSpace: 'nowrap' }}>{cta}</div>}
          </div>
        )}
      </div>
    </div>
  )
}

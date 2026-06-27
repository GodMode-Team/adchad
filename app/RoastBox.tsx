'use client'
import { useRef, useState } from 'react'

// The REAL on-demand roast — replaces the mockup's fake URL→roast box.
// Uploads a screenshot + email to /api/roast, then reveals the score card.
type RoastResult = { prospectId: string; score: number; verdict: string; roast: string; originalUrl: string }

const INK = 'var(--ink)', GREEN = 'var(--green)', PINK = 'var(--pink)', YELLOW = 'var(--yellow)'
const F_DISPLAY = 'var(--f-display)', F_BUNGEE = 'var(--f-bungee)', F_MONO = 'var(--f-mono)', F_SANS = 'var(--f-sans)'
const isEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)

export default function RoastBox() {
  const [file, setFile] = useState<File | null>(null)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<RoastResult | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const ready = !!file && isEmail(email) && status !== 'loading'

  async function roastMe() {
    if (!file || !isEmail(email) || status === 'loading') return
    setStatus('loading'); setError(''); setResult(null)
    try {
      const fd = new FormData()
      fd.append('image', file)
      fd.append('email', email)
      const res = await fetch('/api/roast', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (res.ok) { setResult(data as RoastResult); setStatus('done') }
      else { setError((data as { error?: string }).error || 'roast failed — try again'); setStatus('error') }
    } catch {
      setError('network died mid-roast — try again'); setStatus('error')
    }
  }

  return (
    <div style={{ marginTop: 26, maxWidth: 520 }}>
      <style>{`
        .rb-roast{transition:all .12s ease}
        .rb-roast:not(:disabled):hover{background:${INK};color:#fff}
        .rb-roast:disabled{opacity:.45;cursor:not-allowed}
        .rb-drop{transition:all .12s ease}
        .rb-drop:hover{border-color:${PINK};background:#fafafa}
        .rb-unfuck{transition:background .12s ease}
        .rb-unfuck:hover{background:${YELLOW}}
        .rb-input::placeholder{color:#8a8d91}
      `}</style>

      {/* the input box — white brutalist card, matches the mockup's hero box */}
      <div style={{ background: '#fff', border: `4px solid ${INK}`, borderRadius: 14, padding: 10, boxShadow: `6px 6px 0 ${INK}` }}>
        {/* file drop zone */}
        <label
          className="rb-drop"
          style={{
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            border: `2px dashed ${file ? GREEN : '#bbb'}`, borderRadius: 10, padding: '12px 14px',
            fontFamily: F_MONO, fontSize: 13, color: file ? '#0a3d16' : '#555', background: '#fff',
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>{file ? '✅' : '📸'}</span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file ? file.name : 'drop a screenshot of your ad'}
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); setStatus('idle'); setError('') }}
            style={{ display: 'none' }}
          />
        </label>

        {/* email + ROAST ME */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            className="rb-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="where the roast lands (email)"
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontFamily: F_MONO, fontSize: 14, color: INK, padding: '10px 12px', background: 'transparent' }}
          />
          <button
            className="rb-roast"
            onClick={roastMe}
            disabled={!ready}
            style={{ cursor: 'pointer', fontFamily: F_BUNGEE, fontSize: 15, color: '#fff', background: PINK, border: `3px solid ${INK}`, padding: '11px 16px', whiteSpace: 'nowrap', borderRadius: 0 }}
          >
            {status === 'loading' ? 'ROASTING…' : 'ROAST ME'}
          </button>
        </div>
      </div>

      {/* processing state — Chad's reviewing your ad (~30s) */}
      {status === 'loading' && (
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 14, background: INK, border: '4px solid #fff', boxShadow: `6px 6px 0 ${INK}`, borderRadius: 14, padding: '16px 18px' }}>
          <img src="/chad-cutout.png" alt="" style={{ width: 56, animation: 'work 1.1s ease-in-out infinite' }} />
          <div>
            <div style={{ fontFamily: F_DISPLAY, fontSize: 22, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
              Chad&apos;s reviewing your ad
              <span style={{ width: 16, height: 16, border: '3px solid #3a3a3a', borderTopColor: GREEN, borderRadius: '50%', animation: 'spin .8s linear infinite', display: 'inline-block' }} />
            </div>
            <div style={{ fontFamily: F_MONO, fontSize: 11, color: '#7d8a7d', marginTop: 4 }}>~30 seconds · he&apos;s typing with one hand</div>
          </div>
        </div>
      )}

      {/* error state */}
      {status === 'error' && (
        <div style={{ marginTop: 14, background: '#1a0f14', border: `4px solid ${PINK}`, boxShadow: `6px 6px 0 ${INK}`, borderRadius: 14, padding: '16px 18px', animation: 'pop .35s ease' }}>
          <div style={{ fontFamily: F_BUNGEE, fontSize: 13, color: PINK, marginBottom: 6 }}>NO ROAST FOR YOU</div>
          <div style={{ fontFamily: F_SANS, fontSize: 14, color: '#e7cdd6', lineHeight: 1.45 }}>{error}</div>
        </div>
      )}

      {/* the score card — revealed on 200 */}
      {status === 'done' && result && (
        <div style={{ marginTop: 14, background: INK, border: '4px solid #fff', boxShadow: `6px 6px 0 ${INK}`, borderRadius: 14, padding: '16px 18px', animation: 'pop .35s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: F_DISPLAY, fontSize: 52, color: PINK, lineHeight: 0.8 }}>{result.score}</div>
            <div>
              <div style={{ fontFamily: F_DISPLAY, fontSize: 18, color: '#fff' }}>/100</div>
              <div style={{ display: 'inline-block', transform: 'rotate(-7deg)', marginTop: 3, background: YELLOW, color: INK, fontFamily: F_BUNGEE, fontSize: 12, padding: '2px 9px' }}>OUCH</div>
            </div>
            <div style={{ flex: 1, fontFamily: F_MONO, fontSize: 11, color: '#7d8a7d', textAlign: 'right' }}>
              the verdict<br /><span style={{ color: GREEN }}>{result.verdict}</span>
            </div>
          </div>
          <div style={{ fontFamily: F_SANS, fontSize: 14, color: '#e3e5e9', marginTop: 12, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{result.roast}</div>
          <a
            className="rb-unfuck"
            href={`/p/${result.prospectId}`}
            style={{ display: 'block', marginTop: 14, textAlign: 'center', fontFamily: F_BUNGEE, fontSize: 16, color: INK, background: GREEN, border: '3px solid #fff', padding: 11, borderRadius: 10 }}
          >
            UNFUCK IT → $5
          </a>
        </div>
      )}
    </div>
  )
}

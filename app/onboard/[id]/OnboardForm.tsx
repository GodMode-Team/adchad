'use client'
import { useState } from 'react'

const INK = 'var(--ink)', YELLOW = 'var(--yellow)', PINK = 'var(--pink)', GREEN = 'var(--green)'
const F_DISPLAY = 'var(--f-display)', F_BUNGEE = 'var(--f-bungee)', F_MONO = 'var(--f-mono)', F_SANS = 'var(--f-sans)'

// The curated v1 intake (static — dynamic per-business questions come later). Chad needs this to do the work.
const QUESTIONS: { key: string; label: string; hint: string; long?: boolean }[] = [
  { key: 'business', label: 'What does your business do?', hint: 'one or two lines — the plain version' },
  { key: 'audience', label: "Who's it for?", hint: 'your ideal customer — who should the ad stop in their feed' },
  { key: 'offer', label: "What's the offer?", hint: "what you're selling or promoting right now" },
  { key: 'usp', label: 'Why you and not the other guy?', hint: 'your edge — what actually makes you different', long: true },
  { key: 'competitors', label: 'Your top 3 competitors', hint: 'names or links — I’ll go study their ads' },
  { key: 'channels', label: 'Where do you run ads?', hint: 'Meta, Google, TikTok, none yet…' },
  { key: 'budget', label: 'Monthly budget & target', hint: 'e.g. "$2k/mo, want leads under $40"' },
  { key: 'win', label: 'What does a 30-day win look like?', hint: 'the number that would make this obviously worth it' },
  { key: 'brand', label: 'Brand assets + anything I should never say', hint: 'logo/photo links, tone, claims you legally can’t make', long: true },
  { key: 'report_email', label: 'Where should the report go?', hint: 'the email to send your weekly report to' },
]

export default function OnboardForm({ id }: { id: string }) {
  const [a, setA] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [reportBy, setReportBy] = useState<string | null>(null)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setA((p) => ({ ...p, [k]: v }))
  const ready = QUESTIONS.every((q) => (a[q.key] || '').trim().length > 0) && status !== 'loading'

  async function submit() {
    if (!ready) return
    setStatus('loading'); setError('')
    try {
      const r = await fetch('/api/onboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ p: id, answers: a }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'something broke')
      setReportBy(d.reportBy ?? null); setStatus('done')
    } catch (e: any) { setError(String(e?.message || e)); setStatus('error') }
  }

  if (status === 'done') {
    return (
      <div style={{ minHeight: '100vh', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ maxWidth: 540, textAlign: 'center' }}>
          <div style={{ fontFamily: F_DISPLAY, fontSize: 'clamp(40px,8vw,68px)', lineHeight: 0.9, color: INK }}>I&apos;M ON IT. 🔨</div>
          <div style={{ fontFamily: F_SANS, fontSize: 17, color: '#0a3d16', fontWeight: 600, marginTop: 16, lineHeight: 1.45 }}>
            Got everything I need. I&apos;m going to study your market, your competitors, and your current ads.
          </div>
          <div style={{ display: 'inline-block', marginTop: 22, transform: 'rotate(-1.5deg)', background: INK, color: YELLOW, fontFamily: F_BUNGEE, fontSize: 18, padding: '12px 20px', border: `3px solid ${INK}`, boxShadow: `5px 5px 0 ${PINK}` }}>
            FIRST REPORT BY {reportBy}
          </div>
          <div style={{ fontFamily: F_MONO, fontSize: 13, color: '#0a3d16', marginTop: 18 }}>a fresh ad · competitor intel · a read on what you’re running now</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: YELLOW, padding: 'clamp(28px,5vw,56px) 20px' }}>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', transform: 'rotate(-2deg)', background: INK, color: YELLOW, fontFamily: F_BUNGEE, fontSize: 13, padding: '6px 14px', boxShadow: `4px 4px 0 ${PINK}` }}>🔨 CHAD ON RETAINER · INTAKE</div>
        <div style={{ fontFamily: F_DISPLAY, fontSize: 'clamp(38px,7vw,62px)', lineHeight: 0.9, color: INK, marginTop: 16 }}>
          TELL ME ABOUT<br />YOUR <span style={{ color: '#fff', WebkitTextStroke: `2px ${INK}`, textShadow: `4px 4px 0 ${PINK}` }}>BUSINESS.</span>
        </div>
        <div style={{ fontFamily: F_SANS, fontSize: 16, color: INK, fontWeight: 500, marginTop: 12, maxWidth: 520, lineHeight: 1.45 }}>
          The more you give me, the sharper your first report. Takes about 5 minutes — your week-one clock starts when you hit submit.
        </div>

        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {QUESTIONS.map((q, i) => (
            <label key={q.key} style={{ display: 'block', background: '#fff', border: `3px solid ${INK}`, borderRadius: 12, padding: '14px 16px', boxShadow: `5px 5px 0 ${INK}` }}>
              <div style={{ fontFamily: F_BUNGEE, fontSize: 15, color: INK }}>{i + 1}. {q.label}</div>
              <div style={{ fontFamily: F_MONO, fontSize: 12, color: '#6b6e00', margin: '3px 0 9px' }}>{q.hint}</div>
              {q.long ? (
                <textarea value={a[q.key] || ''} onChange={(e) => set(q.key, e.target.value)} rows={3}
                  style={{ width: '100%', resize: 'vertical', fontFamily: F_SANS, fontSize: 15, color: INK, border: `2px solid #ddd`, borderRadius: 8, padding: '9px 11px', outline: 'none', boxSizing: 'border-box' }} />
              ) : (
                <input value={a[q.key] || ''} onChange={(e) => set(q.key, e.target.value)} type={q.key === 'report_email' ? 'email' : 'text'}
                  style={{ width: '100%', fontFamily: F_SANS, fontSize: 15, color: INK, border: `2px solid #ddd`, borderRadius: 8, padding: '9px 11px', outline: 'none', boxSizing: 'border-box' }} />
              )}
            </label>
          ))}
        </div>

        {status === 'error' && <div style={{ fontFamily: F_MONO, fontSize: 13, color: '#b00020', marginTop: 14 }}>{error}</div>}

        <button onClick={submit} disabled={!ready}
          style={{ width: '100%', marginTop: 22, cursor: ready ? 'pointer' : 'not-allowed', opacity: ready ? 1 : 0.5,
            background: PINK, color: '#fff', border: `4px solid ${INK}`, borderRadius: 14, padding: '16px', boxShadow: `5px 5px 0 ${INK}`, fontFamily: F_BUNGEE, fontSize: 20 }}>
          {status === 'loading' ? 'SENDING…' : 'START MY FIRST REPORT →'}
        </button>
        <div style={{ fontFamily: F_MONO, fontSize: 11, color: INK, textAlign: 'center', marginTop: 12, opacity: 0.7 }}>fill in every field to submit</div>
      </div>
    </div>
  )
}

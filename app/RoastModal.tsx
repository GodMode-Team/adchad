'use client'
import { useState, useEffect } from 'react'
import RoastBox from './RoastBox'

// Hero CTA pair + the drop-your-ad modal. The screenshot box used to live inline in the
// hero and crowd it — now it only appears when someone actually means it.
const INK = 'var(--ink)', PINK = 'var(--pink)'
const F_BUNGEE = 'var(--f-bungee)', F_MONO = 'var(--f-mono)', F_DISPLAY = 'var(--f-display)'

export default function RoastModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open])

  return (
    <>
      <style>{`
        .rm-cta{transition:all .12s ease}
        .rm-cta:hover{background:${INK};color:#fff;box-shadow:2px 2px 0 ${INK};transform:translate(3px,3px)}
        .rm-ghost{transition:color .12s ease}
        .rm-ghost:hover{color:${PINK}}
        .rm-close{transition:transform .12s ease}
        .rm-close:hover{transform:scale(1.2)}
        .rm-overlay{animation:rmfade .14s ease}
        .rm-card{animation:rmpop .18s ease}
        @keyframes rmfade{from{opacity:0}to{opacity:1}}
        @keyframes rmpop{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
        <button
          className="rm-cta"
          onClick={() => setOpen(true)}
          style={{ cursor: 'pointer', fontFamily: F_BUNGEE, fontSize: 20, color: '#fff', background: PINK, border: `3px solid ${INK}`, boxShadow: `5px 5px 0 ${INK}`, padding: '15px 28px' }}
        >
          ROAST YOUR AD → FREE
        </button>
        <a className="rm-ghost" href="#how" style={{ fontFamily: F_MONO, fontSize: 14, fontWeight: 600, color: INK, textDecoration: 'none', borderBottom: `2px solid rgba(17,17,17,.32)`, paddingBottom: 2 }}>
          no thanks, I enjoy losing money
        </a>
      </div>

      {open && (
        <div
          className="rm-overlay"
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(8,8,8,.66)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '7vh 18px 28px', overflowY: 'auto' }}
        >
          <div
            className="rm-card"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 540, background: '#fff', border: `4px solid ${INK}`, borderRadius: 16, boxShadow: `10px 10px 0 ${INK}`, padding: '24px 22px 28px', position: 'relative' }}
          >
            <button className="rm-close" onClick={() => setOpen(false)} aria-label="Close" style={{ position: 'absolute', top: 10, right: 14, cursor: 'pointer', background: 'none', border: 'none', fontFamily: F_BUNGEE, fontSize: 24, color: INK, lineHeight: 1 }}>×</button>
            <div style={{ fontFamily: F_DISPLAY, fontSize: 32, color: INK, lineHeight: 0.88, paddingRight: 28 }}>DROP YOUR AD.<br /><span style={{ color: PINK }}>I&apos;LL ROAST IT.</span></div>
            <div style={{ fontFamily: F_MONO, fontSize: 12.5, color: '#555', marginTop: 9 }}>screenshot in, roast out · ~30 seconds · brutal but useful</div>
            <RoastBox />
          </div>
        </div>
      )}
    </>
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { describe as visionLook } from '../../../tools/vision'
import { roast } from '../../../tools/roast'
import { run } from '../../../tools/db'
import { hit } from '../../../lib/ratelimit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // vision + Grok are ~30s of model round-trips

const MAX_BYTES = 4 * 1024 * 1024              // under Vercel's 4.5MB body limit
const DAILY_CAP = 40                            // durable ceiling on paid roasts/day — bounds the financial-DoS surface
const OK_MIME = /^image\/(png|jpe?g|webp|gif)$/ // no SVG (script vector)
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'web'
const isEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)

// On-demand roast — the Home ROAST-ME box uploads a screenshot of their ad + email → a REAL roast (shown INLINE).
// Public + no-auth, so spend is bounded: a DB-backed daily cap + per-email/per-IP throttle. (Production: add a CAPTCHA.)
export async function POST(req: NextRequest) {
  try {
    // reject oversized bodies BEFORE buffering the whole thing into memory
    const len = Number(req.headers.get('content-length') || 0)
    if (len > MAX_BYTES + 1024) return NextResponse.json({ error: 'image too big (4MB max)' }, { status: 413 })

    // durable daily cap — bounds total spend regardless of IP/email spoofing or instance restarts
    const quota = (await run('roastquota', {}).catch(() => ({ today: 0 }))) as any
    if ((quota?.today ?? 0) >= DAILY_CAP) return NextResponse.json({ error: "Chad's roasted his daily quota — come back tomorrow." }, { status: 429 })

    const form = await req.formData()
    const file = form.get('image')
    const email = String(form.get('email') ?? '').trim().toLowerCase()
    if (!(file instanceof File)) return NextResponse.json({ error: 'attach a screenshot of your ad' }, { status: 400 })
    if (!isEmail(email)) return NextResponse.json({ error: 'a valid email is required' }, { status: 400 })
    if (!OK_MIME.test(file.type)) return NextResponse.json({ error: 'upload a PNG / JPG / WEBP screenshot' }, { status: 415 })
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'image too big (4MB max)' }, { status: 413 })
    if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: 'upload not configured' }, { status: 500 })

    // per-email + per-IP throttle (trusted x-real-ip; in-memory backstop on top of the durable cap)
    const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'local'
    if (!hit(`roast:e:${email}`, 3, 86_400_000) || !hit(`roast:ip:${ip}`, 12, 86_400_000))
      return NextResponse.json({ error: "easy — you've had your roasts for today." }, { status: 429 })

    // 1. upload the screenshot → Blob (a public URL the vision model can read)
    const buf = Buffer.from(await file.arrayBuffer())
    const up = await put(`roasts/${slug(email)}-${Date.now()}.png`, buf, { access: 'public', contentType: file.type, token: process.env.BLOB_READ_WRITE_TOKEN })
    const originalUrl = up.url

    // 2. SEE it ONCE (vision + score), then reuse that look for the roast — no double vision charge
    const look = await visionLook(originalUrl)
    const r = await roast({ image: originalUrl, look })

    // 3. persist ad + prospect + PRIVATE roast (channel='roast', not posted to X) + score → /p/<id> works
    const pid = `web-${slug(email)}-${Date.now().toString(36)}`
    const adId = `webad-${Date.now().toString(36)}`
    await run('intake', { json: JSON.stringify({ prospect_id: pid, ad_id: adId, name: null, email, creative_url: originalUrl, roast: r.xPost || r.raw, score: look.score }) })

    // The roast is shown INLINE (RoastBox reveals it + the /p link). We deliberately do NOT email an unverified
    // address — that would make this an open relay / harassment vector. Email delivery needs verification first.
    return NextResponse.json({ prospectId: pid, score: look.score, verdict: look.verdict, roast: r.xPost || r.raw, originalUrl })
  } catch (e) {
    console.error('roast intake error', e)
    return NextResponse.json({ error: 'roast failed — try again' }, { status: 500 })
  }
}

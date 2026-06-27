import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { describe as visionLook } from '../../../tools/vision'
import { roast } from '../../../tools/roast'
import { run } from '../../../tools/db'
import { send } from '../../../tools/email'
import { hit } from '../../../lib/ratelimit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // vision + Grok are ~30s of model round-trips

const MAX_BYTES = 5 * 1024 * 1024
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'web'
const isEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)

// On-demand roast — the Home ROAST-ME box uploads a screenshot of their ad + email → a REAL roast.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('image')
    const email = String(form.get('email') ?? '').trim().toLowerCase()
    if (!(file instanceof File)) return NextResponse.json({ error: 'attach a screenshot of your ad' }, { status: 400 })
    if (!isEmail(email)) return NextResponse.json({ error: 'a valid email is required' }, { status: 400 })
    if (!/^image\//.test(file.type)) return NextResponse.json({ error: "that's not an image" }, { status: 415 })
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'image too big (5MB max)' }, { status: 413 })
    if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: 'upload not configured' }, { status: 500 })

    // rate-limit per email + per IP — each roast spends real money (vision + Grok)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
    if (!hit(`roast:e:${email}`, 3, 86_400_000) || !hit(`roast:ip:${ip}`, 12, 86_400_000))
      return NextResponse.json({ error: "easy — you've had your roasts for today. come back tomorrow." }, { status: 429 })

    // 1. upload the screenshot → Blob (a public URL the vision model can read)
    const buf = Buffer.from(await file.arrayBuffer())
    const up = await put(`roasts/${slug(email)}-${Date.now()}.png`, buf, { access: 'public', contentType: file.type || 'image/png', token: process.env.BLOB_READ_WRITE_TOKEN })
    const originalUrl = up.url

    // 2. SEE it (vision + score) and roast it (the "ad handed to you" path — a private reply, NOT an X post)
    const look = await visionLook(originalUrl)
    const r = await roast({ image: originalUrl })

    // 3. persist ad + prospect + private roast + score so /p/<id> works
    const pid = `web-${slug(email)}-${Date.now().toString(36)}`
    const adId = `webad-${Date.now().toString(36)}`
    await run('intake', { json: JSON.stringify({ prospect_id: pid, ad_id: adId, name: null, email, creative_url: originalUrl, roast: r.xPost || r.raw, score: look.score }) })

    // 4. email the roast + the $5 link — gated by the kill-switch (publishing/sending halts when paused)
    const base = process.env.APP_URL || new URL(req.url).origin
    const link = `${base}/p/${pid}`
    const paused = (await run('status', {}) as any)?.paused
    if (!paused && process.env.RESEND_API_KEY) {
      await send({ to: email, subject: r.emailSubject || 'your ad got roasted', body: `${r.emailBody || r.xPost}\n\nThe fix → ${link}` }).catch(() => {})
    }

    return NextResponse.json({ prospectId: pid, score: look.score, verdict: look.verdict, roast: r.xPost || r.raw, originalUrl })
  } catch (e) {
    console.error('roast intake error', e)
    return NextResponse.json({ error: 'roast failed — try again' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { run } from '../../../tools/db'

export const dynamic = 'force-dynamic'

// Thank-you page polls this: has THIS prospect's fix been delivered, and what's the X reply to embed?
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('p') || ''
  if (!id) return NextResponse.json({ delivered: false })
  try {
    return NextResponse.json(await run('fixstatus', { id }))
  } catch {
    return NextResponse.json({ delivered: false })
  }
}

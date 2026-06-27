import { run } from '../../../tools/db'
import Funnel from './Funnel'

export const dynamic = 'force-dynamic'

// The conversion funnel: their real ad + the real roast → real Stripe checkout. Mobile-first.
// params/searchParams are Promises in Next 15.
export default async function SalesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ paid?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const data: any = await run('page', { id }).catch(() => ({ found: false }))

  if (!data.found) {
    return (
      <main
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          background: 'var(--green)',
          color: 'var(--ink)',
          textAlign: 'center',
          padding: 28,
        }}
      >
        <div style={{ fontFamily: 'var(--f-display)', fontSize: 56, lineHeight: 0.92, letterSpacing: -1 }}>
          THIS ROAST
          <br />
          MOVED ON.
        </div>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 13, color: '#0a3d16', maxWidth: 300 }}>
          The page you&apos;re after has rolled off. The roasting never stops, though.
        </div>
        <a
          href="/"
          style={{
            fontFamily: 'var(--f-bungee)',
            fontSize: 20,
            background: 'var(--ink)',
            color: 'var(--yellow)',
            padding: '14px 22px',
            borderRadius: 14,
            border: '4px solid #fff',
            boxShadow: '0 0 0 4px var(--ink)',
          }}
        >
          AdChad →
        </a>
      </main>
    )
  }

  return <Funnel data={data} paid={sp.paid === '1'} id={id} />
}

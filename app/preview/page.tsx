import Funnel from '../p/[id]/Funnel'

export const dynamic = 'force-dynamic'

// Standalone preview of the conversion funnel with mock data — no DB or real prospect needed.
//   /preview            → the roast page
//   /preview?step=paywall → the checkout page
//   /preview?step=done    → the upsell / delivery page
const MOCK = {
  found: true,
  name: 'Bella Vista Med Spa',
  score: 23,
  roast_text:
    '"We Do Botox & More!" is not a hook, it’s hold music. The photo is a stock woman touching a face that isn’t even her problem, and "Learn More" is the button people click right before they don’t. 23/100 — and I’m being generous because the logo’s at least centered.',
  ad: { copy: '✨We Do Botox & More!✨ Call us TODAY!!! 💉🔥', creative_url: '/medspa-stock.png' },
}

export default async function PreviewPage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const { step } = await searchParams
  const s: 'roast' | 'paywall' | 'done' = step === 'paywall' ? 'paywall' : step === 'done' ? 'done' : 'roast'
  return <Funnel data={MOCK} id="preview" paid={s === 'done'} initialStep={s} />
}

import OnboardForm from './OnboardForm'

export const dynamic = 'force-dynamic'

// The retainer intake form. The 1-week "first report" clock starts when this is submitted.
export default async function OnboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <OnboardForm id={id} />
}

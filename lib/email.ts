import { Resend } from 'resend'

const from = () => process.env.RESEND_FROM || 'AdChad <onboarding@resend.dev>'
const resend = () => new Resend(process.env.RESEND_API_KEY)

/** Outreach: the public roast + the $5 fix offer, to the business owner. */
export async function outreachEmail(
  prospect: { name?: string | null; email: string },
  roast: { text: string; hook: string },
  tweetUrl: string,
  buyUrl: string,
): Promise<{ id: string }> {
  const { data, error } = await resend().emails.send({
    from: from(),
    to: prospect.email,
    subject: 'We audited your Meta ad (it’s leaking money)',
    text:
      `Hey ${prospect.name ?? 'there'},\n\n` +
      `We pulled one of your live Meta ads and it’s underperforming — so we did the work for you and posted the breakdown publicly:\n\n` +
      `"${roast.text}"\n${tweetUrl}\n\n` +
      `The fix is simple. We’ll rewrite the whole thing — headline, body, CTA + a ready-to-run ad image — for $5:\n${buyUrl}\n\n` +
      `${roast.hook}\n\n— AdChad\n\nReply STOP to opt out.`,
  })
  if (error) throw new Error(error.message)
  return { id: data!.id }
}

/** Fulfillment: deliver the paid fix to the buyer. */
export async function fulfillmentEmail(
  to: string,
  fix: { headline: string; body: string; cta: string; creativeDirection?: string; imageUrl?: string },
): Promise<{ id: string }> {
  const { data, error } = await resend().emails.send({
    from: from(),
    to,
    subject: 'Your fixed ad is ready 🎯',
    text:
      `Here's your rewritten ad:\n\n` +
      `HEADLINE\n${fix.headline}\n\nBODY\n${fix.body}\n\nCTA\n${fix.cta}\n\n` +
      `CREATIVE DIRECTION\n${fix.creativeDirection ?? '—'}\n\n` +
      (fix.imageUrl ? `READY-TO-RUN AD IMAGE\n${fix.imageUrl}\n\n` : '') +
      `— AdChad`,
  })
  if (error) throw new Error(error.message)
  return { id: data!.id }
}

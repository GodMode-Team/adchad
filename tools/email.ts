import { Resend } from 'resend'
import { sql } from '../lib/db'

const FROM = () => process.env.RESEND_FROM || 'AdChad <onboarding@resend.dev>'
// CAN-SPAM: opt-out + a valid physical address. Set MAILING_ADDRESS in .env.local.
const FOOTER = () => `\n\n—\nAdChad · reply STOP to opt out · ${process.env.MAILING_ADDRESS || '<set MAILING_ADDRESS>'}`

/** Send one email. The agent composes subject + body (in-voice) — this is just the wire. */
export async function send(o: { to: string; subject: string; body: string }): Promise<{ id: string }> {
  const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: FROM(), to: o.to, subject: o.subject, text: o.body + FOOTER(),
  })
  if (error) throw new Error(error.message)
  return { id: data!.id }
}

// ponytail: inbound capture is a Resend inbound webhook → interactions(direction='in'). read() drains the unhandled ones.
export async function read(): Promise<{ items: any[] }> {
  const rows = await sql`
    select id, prospect_id, from_addr, subject, text, created_at
      from interactions
     where channel = 'email' and direction = 'in' and handled = false
     order by created_at desc limit 20`
  return { items: [...rows] }
}

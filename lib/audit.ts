import { sql } from './db'

export type AuditData = {
  metrics: { scanned: number; enriched: number; qualified: number; posted: number; emailed: number; revenue_cents: number }
  roasts: any[]
  paused: boolean
}

export async function auditData(): Promise<AuditData> {
  const [metrics] = await sql<any[]>`select
    (select count(*) from ads)::int as scanned,
    (select count(*) from prospects where status <> 'new')::int as enriched,
    (select count(*) from scores where gate = 'qualify')::int as qualified,
    (select count(*) from roasts where tweet_id is not null)::int as posted,
    (select count(*) from roasts where emailed_at is not null)::int as emailed,
    (select coalesce(sum(amount), 0) from orders where status = 'paid')::int as revenue_cents`

  const roasts = await sql<any[]>`
    select r.text, r.status, r.post_url, p.name, p.segment,
           s.total, s.gate, s.badness, s.economic, s.reach_safety,
           (s.votes->'badnessReasons'->>0) as reason
      from roasts r
      join prospects p on p.id = r.prospect_id
      left join scores s on s.ad_id = r.ad_id
     order by r.created_at desc limit 25`

  const [c] = await sql<{ paused: boolean }[]>`select paused from control where id = 1`
  return { metrics, roasts, paused: !!c?.paused }
}

export async function setPaused(p: boolean): Promise<void> {
  await sql`update control set paused = ${p} where id = 1`
}

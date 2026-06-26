import { sql } from '../lib/db'

type F = Record<string, string | boolean>

/** The agent's CRM + ledger. Named ops only — no raw SQL from the model. */
export async function run(sub: string | undefined, f: F): Promise<unknown> {
  switch (sub) {
    case 'metrics': {
      const [m] = await sql`select
        (select count(*) from prospects)::int                          as prospects,
        (select count(*) from prospects where stage='roasted')::int    as roasted,
        (select count(*) from prospects where stage='contacted')::int  as contacted,
        (select count(*) from prospects where stage='replied')::int    as replied,
        (select count(*) from prospects where stage='customer')::int   as customers,
        (select count(*) from orders where status='paid')::int         as orders_paid,
        (select coalesce(sum(amount),0) from orders where status='paid')::int as revenue_cents`
      return m
    }
    case 'ledger': {
      const [rev] = await sql`select coalesce(sum(amount_cents),0)::int c from ledger where kind='revenue'`
      const [cost] = await sql`select coalesce(sum(amount_cents),0)::int c from ledger where kind='cost'`
      return { revenue_cents: rev.c, cost_cents: cost.c, margin_cents: rev.c - cost.c }
    }
    case 'prospects': {
      const rows = f.stage
        ? await sql`select id,name,segment,stage,email,x_handle from prospects where stage=${String(f.stage)} order by created_at desc limit 25`
        : await sql`select id,name,segment,stage,email,x_handle from prospects order by created_at desc limit 25`
      return { items: [...rows] }
    }
    case 'page': { // the /p/<id> sales-page payload: the SPECIFIC roasted ad + the roast
      const id = String(f.id)
      const [p] = await sql<any[]>`select id, name, segment, x_handle from prospects where id=${id} limit 1`
      if (!p) return { found: false }
      const [r] = await sql<any[]>`select ad_id, text from interactions where prospect_id=${id} and channel='x' and direction='out' order by created_at desc limit 1`
      const [ad] = r?.ad_id
        ? await sql<any[]>`select advertiser, creative_url, copy, link_url from ads where id=${r.ad_id}`
        : await sql<any[]>`select advertiser, creative_url, copy, link_url from ads where brand_id=${id} and creative_url is not null order by created_at desc limit 1`
      return { found: true, name: p.name, segment: p.segment, ad: ad ?? null, roast_text: r?.text ?? null }
    }
    case 'orders': { // unfulfilled paid orders, for the fulfill heartbeat
      const rows = await sql<any[]>`select o.id, o.prospect_id, o.tier, o.amount, o.buyer_email, o.status
        from orders o where o.status='paid'
          and not exists (select 1 from fixes fx where fx.order_id=o.id and fx.delivered_at is not null)
        order by o.created_at asc limit 25`
      return { items: [...rows] }
    }
    case 'gallery': { // case-study feed: the SPECIFIC roasted ad → roast → fixed ad
      const rows = await sql<any[]>`
        select p.id, p.name, r.ad_id, r.text as roast,
          (select creative_url from ads where id = r.ad_id) as original,
          (select ref  from interactions where prospect_id=p.id and channel='fix' order by created_at desc limit 1) as fix_image,
          (select text from interactions where prospect_id=p.id and channel='fix' order by created_at desc limit 1) as fix_copy
        from prospects p
        join lateral (
          select ad_id, text from interactions
          where prospect_id=p.id and channel='x' and direction='out'
          order by created_at desc limit 1
        ) r on true
        order by p.created_at desc limit 24`
      return { items: [...rows] }
    }
    case 'record': {
      const j = JSON.parse(String(f.json || '{}'))
      const [r] = await sql`insert into interactions (prospect_id, ad_id, channel, direction, ref, from_addr, subject, text)
        values (${j.prospect_id ?? null}, ${j.ad_id ?? null}, ${j.channel ?? 'note'}, ${j.direction ?? 'out'}, ${j.ref ?? null},
                ${j.from_addr ?? null}, ${j.subject ?? null}, ${j.text ?? null}) returning id`
      return { id: r.id }
    }
    case 'stage':
      await sql`update prospects set stage=${String(f.stage)} where id=${String(f.id)}`
      return { ok: true }
    case 'spend': // record a tool cost (P&L) — requires human approval per guardrails
      await sql`insert into ledger (kind, amount_cents, note) values ('cost', ${Number(f.cents || 0)}, ${String(f.note || '')})`
      return { ok: true }
    case 'revenue':
      await sql`insert into ledger (kind, amount_cents, note) values ('revenue', ${Number(f.cents || 0)}, ${String(f.note || '')})`
      return { ok: true }
    case 'pause':
      await sql`update control set paused=true where id=1`
      return { paused: true }
    case 'resume':
      await sql`update control set paused=false where id=1`
      return { paused: false }
    case 'status': {
      const [c] = await sql`select paused from control where id=1`
      return { paused: !!c?.paused }
    }
    default:
      throw new Error(`db: unknown op '${sub}'. try: metrics ledger prospects record stage spend revenue pause resume status`)
  }
}

import { sql } from '../lib/db'

type F = Record<string, string | number | boolean> // CLI passes string|boolean; programmatic callers (routes, tests) may pass numbers

/** Map one CRM interaction to a public feed event (or null = not shown). Pure → unit-tested. The webhook's PAID
 *  note (channel='note', direction='in') reads as a "generating…" working state, NOT a reply — so the feed never
 *  claims "<who> replied" ~90s before the fix actually posts. */
export function interactionEvent(i: any): any | null {
  const who = i.prospect_name ?? 'a brand'
  if (i.channel === 'launch' || i.channel === 'mention') return null // internal dedup markers (launch / @adchad summon) — never public events
  if (i.channel === 'x' && i.direction === 'out') // public roast — text is already public on X
    return { ts: i.created_at, kind: 'roast', icon: '🔥', title: `Roasted ${who}`, detail: i.text ? String(i.text).slice(0, 240) : undefined, link: i.ref ? `https://x.com/i/status/${i.ref}` : undefined, score: i.score != null ? Number(i.score) : undefined }
  if (i.channel === 'note' && i.direction === 'in') // webhook PAID marker → the fix is generating now (NOT a reply)
    return { ts: i.created_at, kind: 'paid', icon: '⏳', title: `${who} paid — fix generating…` }
  if (i.direction === 'in') // a genuine inbound reply/DM — show that it happened, never the private body
    return { ts: i.created_at, kind: 'reply', icon: '💬', title: `${who} replied` }
  if (i.channel === 'email' && i.direction === 'out')
    return { ts: i.created_at, kind: 'email', icon: '📧', title: `Emailed ${who}` }
  if (i.channel === 'fix') // image is viewer-fetched — require https to block http tracking / mixed content
    return { ts: i.created_at, kind: 'fix', icon: '✅', title: `Delivered fix to ${who}`, image: i.ref && String(i.ref).startsWith('https://') ? i.ref : undefined, link: i.link_url ? String(i.link_url) : undefined }
  if (i.channel === 'retainer' && i.direction === 'out') // $49/mo retainer signed (only live-mode rows are ever written)
    return { ts: i.created_at, kind: 'hired', icon: '💼', title: `${who} put Chad on retainer — $49/mo` }
  return null // channel='note'/out (internal reasoning) and anything else: not shown
}

/** The agent's CRM + ledger. Named ops only — no raw SQL from the model. */
export async function run(sub: string | undefined, f: F): Promise<unknown> {
  switch (sub) {
    case 'metrics': {
      const [m] = await sql`select
        (select count(*) from prospects where coalesce(email_source,'')<>'inbound')::int                       as prospects,
        (select count(*) from prospects where stage='roasted' and coalesce(email_source,'')<>'inbound')::int    as roasted,
        (select count(*) from prospects where stage='contacted')::int  as contacted,
        (select count(*) from prospects where stage='replied')::int    as replied,
        (select count(*) from prospects where stage='customer')::int   as customers,
        (select count(*) from orders where status='paid' and coalesce(livemode,true) and coalesce(source,'')<>'launch')::int         as orders_paid,
        (select coalesce(sum(amount),0) from orders where status='paid' and coalesce(livemode,true) and coalesce(source,'')<>'launch')::int as revenue_cents`
      return m
    }
    case 'ledger': {
      const [rev] = await sql`select coalesce(sum(amount_cents),0)::int c from ledger where kind='revenue' and coalesce(livemode,true)`
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
      const [r] = await sql<any[]>`select ad_id, text from interactions where prospect_id=${id} and channel in ('x','roast') and direction='out' order by created_at desc limit 1`
      const [ad] = r?.ad_id
        ? await sql<any[]>`select advertiser, creative_url, copy, link_url from ads where id=${r.ad_id}`
        : await sql<any[]>`select advertiser, creative_url, copy, link_url from ads where brand_id=${id} and creative_url is not null order by created_at desc limit 1`
      const [sc] = await sql<any[]>`select total from scores where ad_id=${r?.ad_id ?? null} or prospect_id=${id} order by created_at desc limit 1`
      return { found: true, name: p.name, segment: p.segment, ad: ad ?? null, roast_text: r?.text ?? null, score: sc ? Number(sc.total) : null }
    }
    case 'fixstatus': { // thank-you page polls this: is THIS prospect's fix delivered, plus the tweet + Meta-ad fields to render it (live tweet on the left, rendered Meta card on the right)
      const [r] = await sql<any[]>`select ref as image, link_url as tweet_url, created_at from interactions
        where prospect_id=${String(f.id)} and channel='fix' and direction='out' order by created_at desc limit 1`
      if (!r) return { delivered: false, image: null, tweetUrl: null, headline: null, body: null, cta: null, name: null }
      const [fx] = await sql<any[]>`select fx.headline, fx.body, fx.cta, fx.image_url, p.name
        from fixes fx join orders o on o.id=fx.order_id join prospects p on p.id=o.prospect_id
        where o.prospect_id=${String(f.id)} and fx.delivered_at is not null order by fx.delivered_at desc limit 1`
      return {
        delivered: true,
        image: r.image ?? fx?.image_url ?? null,
        tweetUrl: r.tweet_url ?? null,
        headline: fx?.headline ?? null, body: fx?.body ?? null, cta: fx?.cta ?? null, name: fx?.name ?? null,
      }
    }
    case 'halls': { // home page: Hall of Shame = lowest-scored public roasts (their tweet); Hall of Fame = delivered fixes (their X reply)
      // ONE entry per business (distinct prospect) so two fixes of the same ad can't fill both slots; then rank.
      const shame = await sql<any[]>`select tweet_id, ad_id, score from (
          select distinct on (i.prospect_id) i.ref as tweet_id, i.ad_id, i.created_at,
            (select total from scores s where s.ad_id = i.ad_id order by s.created_at desc limit 1) as score
          from interactions i
          where i.channel='x' and i.direction='out' and i.ref is not null
          order by i.prospect_id, i.created_at desc
        ) q order by score asc nulls last, created_at desc limit 3`
      // Fame returns the FULL Meta-ad fields (not just the tweet) so the home page renders a real ad card — the public
      // X reply (tweet_url) becomes a "see it live ↗" link. lateral join → public fixes only (one per business).
      const fame = await sql<any[]>`select image_url, headline, body, cta, name, tweet_url from (
          select distinct on (o.prospect_id)
            fx.image_url, fx.headline, fx.body, fx.cta, p.name, i.link_url as tweet_url, fx.delivered_at
          from fixes fx
          join orders o on o.id = fx.order_id
          join prospects p on p.id = o.prospect_id
          join lateral (
            select link_url from interactions
            where prospect_id = o.prospect_id and channel='fix' and direction='out' and link_url is not null
            order by created_at desc limit 1
          ) i on true
          where fx.delivered_at is not null
          order by o.prospect_id, fx.delivered_at desc
        ) q order by delivered_at desc limit 3`
      return {
        // ad_id is `xad-<originalTweetId>` (from xroast) → the original ad tweet so the Hall of Shame shows ad + roast
        shame: shame.map((r) => ({ tweetId: String(r.tweet_id), adTweetId: /^xad-\d+$/.test(String(r.ad_id)) ? String(r.ad_id).slice(4) : null, score: r.score != null ? Number(r.score) : null })),
        fame: fame.map((r) => ({
          image: r.image_url ? String(r.image_url) : null,
          headline: r.headline ? String(r.headline) : null,
          body: r.body ? String(r.body) : null,
          cta: r.cta ? String(r.cta) : null,
          name: r.name ? String(r.name) : null,
          tweetUrl: r.tweet_url ? String(r.tweet_url) : null,
        })),
      }
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
    case 'score': // record a creative score (0–100) for an ad/prospect
      await sql`insert into scores (ad_id, prospect_id, total)
        values (${f.ad_id ? String(f.ad_id) : null}, ${f.prospect_id ? String(f.prospect_id) : null}, ${Number(f.total ?? 0)})`
      return { ok: true }
    case 'intake': { // one on-demand web roast: ad + prospect + PRIVATE roast (channel='roast', not posted to X) + score
      const j = JSON.parse(String(f.json || '{}'))
      const pid = String(j.prospect_id), adId = String(j.ad_id)
      await sql`insert into ads (id, brand_id, advertiser, creative_url) values (${adId}, ${pid}, ${j.name ?? null}, ${j.creative_url ?? null}) on conflict (id) do nothing`
      await sql`insert into prospects (id, name, email, email_source, stage) values (${pid}, ${j.name ?? null}, ${j.email ?? null}, 'inbound', 'web') on conflict (id) do nothing`
      await sql`insert into interactions (prospect_id, ad_id, channel, direction, text) values (${pid}, ${adId}, 'roast', 'out', ${j.roast ?? null})`
      await sql`insert into scores (ad_id, prospect_id, total) values (${adId}, ${pid}, ${Number(j.score ?? 0)})`
      return { ok: true, prospect_id: pid }
    }
    case 'roastquota': { // today's on-demand web roasts — a DURABLE daily cap bounds spend on the public /api/roast endpoint
      const [c] = await sql`select count(*)::int n from interactions where channel='roast' and direction='out' and created_at >= date_trunc('day', now())`
      return { today: c.n }
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
    case 'feed': { // public activity timeline for /live — read-only; PII stripped at the SQL layer (never selects from_addr/subject/buyer_email)
      const [pros, inter, led, metrics, ledger] = await Promise.all([
        // public feed = the agent's OWN prospecting only — never web/email uploaders (email_source='inbound'), who roasted privately
        sql<any[]>`select name, created_at,
            (select total from scores s where s.prospect_id = prospects.id order by s.created_at desc limit 1) as score
          from prospects where coalesce(email_source, '') <> 'inbound' order by created_at desc limit 50`,
        // text is projected to NULL unless it's a public X roast — privacy enforced in SQL, not just in the JS branch below
        sql<any[]>`select i.created_at, i.channel, i.direction, i.ref, i.link_url,
            case when i.channel = 'x' and i.direction = 'out' then i.text else null end as text,
            p.name as prospect_name,
            (select total from scores s where s.ad_id = i.ad_id order by s.created_at desc limit 1) as score
          from interactions i left join prospects p on p.id = i.prospect_id
          order by i.created_at desc limit 50`,
        sql<any[]>`select created_at, kind, amount_cents, note from ledger where coalesce(livemode,true) order by created_at desc limit 50`,
        run('metrics', {}),
        run('ledger', {}),
      ])
      const events: any[] = []
      for (const p of pros) events.push({ ts: p.created_at, kind: 'prospect', icon: '🔍', title: `New target: ${p.name ?? 'unknown'}`, score: p.score != null ? Number(p.score) : undefined })
      for (const i of inter) {
        const e = interactionEvent(i)
        if (e) events.push(e)
      }
      for (const l of led) {
        const amt = `$${(Math.abs(l.amount_cents ?? 0) / 100).toFixed(2)}`
        const note = String(l.note || l.kind).split(/\s+/).filter((w) => w.length <= 20).join(' ').trim() || l.kind // drop ID-like tokens (e.g. Stripe ids) from the public feed
        events.push({ ts: l.created_at, kind: 'money', icon: '💸', title: `${l.kind === 'revenue' ? '+' : '−'}${amt} — ${note}` })
      }
      events.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
      const m = metrics as any, lg = ledger as any // revenue_cents from metrics (orders); cost/margin from ledger — no silent key collision
      return { events: events.slice(0, 50), stats: { ...m, cost_cents: lg.cost_cents, margin_cents: lg.margin_cents } }
    }
    default:
      throw new Error(`db: unknown op '${sub}'. try: metrics ledger prospects page orders gallery feed record stage spend revenue pause resume status`)
  }
}

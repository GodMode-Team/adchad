import { enrich } from '../lib/enrich'
import { sql } from '../lib/db'

// Enrich every prospect using its best (non-social) ad link. Handy manual runner.
;(async () => {
  const rows = await sql<{ id: string; name: string; link_url: string }[]>`
    select p.id, p.name,
           (array_agg(a.link_url order by (a.link_url ilike 'https://%' and a.link_url not ilike '%fb.me%') desc))[1] as link_url
      from prospects p join ads a on a.brand_id = p.id
     group by p.id, p.name`
  for (const r of rows) {
    const e = await enrich({ id: r.id, name: r.name, link_url: r.link_url })
    const em = e.email ? `${e.email}(${e.email_source})` : '-'
    console.log(`${(r.name ?? r.id).slice(0, 24).padEnd(24)} ${e.segment.padEnd(11)} ${em.padEnd(40)} ${e.x_handle ?? '-'}  ${e.website ?? '-'}`)
  }
  await sql.end()
})()

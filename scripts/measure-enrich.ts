import { scan } from '../lib/foreplay'
import { enrich } from '../lib/enrich'
import { sql } from '../lib/db'

// Measure the REAL enrichment hit-rate across diverse verticals (not the VIO worst case).
;(async () => {
  const queries = ['hvac repair', 'dental implants', 'roofing company', 'personal trainer']
  for (const q of queries) {
    const { ads } = await scan(q, 15)
    console.error(`scanned "${q}": ${ads.length} ads`)
  }

  const rows = await sql<{ id: string; name: string; link_url: string }[]>`
    select p.id, p.name,
           (array_agg(a.link_url order by (a.link_url ilike 'https://%' and a.link_url not ilike '%fb.me%') desc))[1] as link_url
      from prospects p join ads a on a.brand_id = p.id
     where p.status = 'new'
     group by p.id, p.name`

  let reach = 0, scraped = 0, guessed = 0
  for (const r of rows) {
    const e = await enrich(r)
    if (e.segment !== 'unreachable') { reach++; if (e.email_source === 'scraped') scraped++; else if (e.email_source === 'guessed') guessed++ }
  }
  const pct = rows.length ? Math.round((100 * reach) / rows.length) : 0
  console.log(`\nENRICHED ${rows.length} fresh prospects → ${reach} reachable (${pct}%)  [scraped ${scraped} · guessed ${guessed}]`)
  const ex = await sql`select name, segment, email, email_source from prospects where email is not null and status='enriched' order by random() limit 8`
  for (const p of ex) console.log(`  ${(p.name ?? '').slice(0, 30).padEnd(30)} ${p.segment}  ${p.email} (${p.email_source})`)
  await sql.end()
})()

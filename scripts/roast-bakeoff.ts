import { config } from 'dotenv'
config({ path: '.env.local' })
import { complete, completeJSON } from '../lib/model'
import { sql } from '../lib/db'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const roastSkill = readFileSync(join(process.cwd(), 'skills/roast/SKILL.md'), 'utf8')
// completeJSON appends this to the system prompt:
const JSON_SUFFIX = '\n\nOutput ONLY a single minified JSON object. No <think>, no markdown, no prose.'

async function roastWith(model: string): Promise<string> {
  try {
    const r = await completeJSON<{ text: string; hook: string }>(roastSkill, USER, { model, temperature: 0.8 })
    return `ROAST: ${r.text}\nHOOK:  ${r.hook}`
  } catch {
    try {
      const raw = await complete(roastSkill + JSON_SUFFIX, USER, { model, temperature: 0.8 })
      return `(JSON parse failed — raw output)\n${raw.slice(0, 500)}`
    } catch (e: any) {
      return `ERROR: ${String(e?.message).slice(0, 180)}`
    }
  }
}

let USER = ''
;(async () => {
  const [ad] = await sql<any[]>`select advertiser, copy, niches from ads where copy is not null and length(copy) between 120 and 500 order by random() limit 1`
  const adText = `Business: ${ad.advertiser}\nNiche: ${(ad.niches || []).join(', ')}\nAd copy: ${ad.copy}`
  USER = `Roast this ad per the skill. "text" must be ≤ 230 characters (we append a link after it).\n${adText}\nJSON: {"text": string, "hook": string}`

  console.log('############ SYSTEM PROMPT = skills/roast/SKILL.md + JSON suffix ############')
  console.log(roastSkill + JSON_SUFFIX)
  console.log('\n############ USER PROMPT ############')
  console.log(USER)

  console.log('\n\n############ A) HERMES-4-405B (current) ############')
  console.log(await roastWith(process.env.MODEL_ROAST || 'nousresearch/hermes-4-405b'))

  console.log('\n############ B) GROK ############')
  for (const g of ['x-ai/grok-4.3', 'x-ai/grok', 'x-ai/grok-2-1212']) {
    const out = await roastWith(g)
    if (!out.startsWith('ERROR')) { console.log(`(model: ${g})\n${out}`); break }
    console.log(`(${g} unavailable: ${out})`)
  }
  await sql.end()
})()

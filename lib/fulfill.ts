import { sql } from './db'
import { completeJSON } from './model'
import { generate } from './creative'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const copySkill = readFileSync(join(process.cwd(), 'skills/copy/SKILL.md'), 'utf8')

export type Fix = { headline: string; body: string; cta: string; creativeDirection: string; imageUrl: string }

/** Rewrite the ad (Iain's `copy` skill) + generate a real ad image. Persists to `fixes` when given an order id. */
export async function fulfill(order: { id?: number; prospect_id?: string; ad?: any }): Promise<Fix> {
  let ad = order.ad
  if (!ad && order.prospect_id) {
    ;[ad] = await sql<any[]>`select advertiser, copy, niches from ads where brand_id = ${order.prospect_id} order by id limit 1`
  }
  const adText = ad
    ? `Advertiser: ${ad.advertiser}\nNiche: ${(ad.niches || []).join(', ')}\nOriginal (weak) ad copy: ${ad.copy ?? '(image-only)'}`
    : '(no original ad on file — write a strong generic ad for the vertical)'

  const c = await completeJSON<{ headline: string; body: string; cta: string; creativeDirection: string }>(
    `You are AdChad's copy engine. Rewrite a weak Meta ad into a high-converting one.\n${copySkill}`,
    `Rewrite this ad — tighter hook, clear offer, strong CTA.\n${adText}\nJSON: {"headline": string, "body": string, "cta": string, "creativeDirection": string}`,
  )

  const { imageUrl } = await generate(c, ad?.advertiser)
  const fix: Fix = { ...c, imageUrl }

  if (order.id) {
    await sql`insert into fixes (order_id, headline, body, cta, creative_dir, image_url, delivered_at)
              values (${order.id}, ${fix.headline}, ${fix.body}, ${fix.cta}, ${fix.creativeDirection}, ${fix.imageUrl}, now())`
  }
  return fix
}

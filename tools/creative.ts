import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderFbMockPng, renderCreativePng, type FbMockSpec } from './render/fb-mock'

/**
 * The creative is rendered DETERMINISTICALLY (tools/render/fb-mock) instead of hallucinated by an image model —
 * killing the slop class the old gpt-image-2 path produced (billing dashboards, AI-meat) and the before/after
 * one-trick-pony at the root (a deterministic graphic simply can't draw one). Two assets per fix:
 *   - imageUrl    → the finished Meta-feed MOCKUP (how it looks live) — the lead tweet / public proof.
 *   - creativeUrl → the BARE 1080×1080 creative — the asset the buyer uploads straight into Meta.
 * Cost is ~0 (local render, no image API). Both are hosted exactly as before.
 */

async function host(png: Uint8Array): Promise<string> {
  const buf = Buffer.from(png)
  const name = `${randomUUID()}.png`
  // Host on Vercel Blob so the deployed funnel can serve it (the worker and the web app don't share a disk).
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob')
    const { url } = await put(`fixes/${name}`, buf, { access: 'public', contentType: 'image/png', token: process.env.BLOB_READ_WRITE_TOKEN })
    return url
  }
  // local fallback (no blob token)
  const dir = join(process.cwd(), 'public', 'fixes')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, name), buf)
  return `/fixes/${name}`
}

export async function generate(spec: FbMockSpec): Promise<{ imageUrl: string; creativeUrl: string; costUsd: number }> {
  const [mock, creative] = await Promise.all([renderFbMockPng(spec), renderCreativePng(spec)])
  const [imageUrl, creativeUrl] = await Promise.all([host(mock), host(creative)])
  return { imageUrl, creativeUrl, costUsd: 0 }
}

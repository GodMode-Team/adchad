import { costUsdOf } from '../cost'

/**
 * Generate a PHOTOGRAPHIC ad background via the OpenRouter image model (gemini-2.5-flash-image / "nano banana").
 * The image carries NO text — the deterministic renderer overlays crisp copy on top (so the scene is epic AND the
 * words never slop). This is the "put the white-background product into an epic real-world scene" move.
 *
 * Returns null on ANY failure (missing key, provider gap, no image) so the caller falls back to a typographic
 * layout and the fix never fails.
 */
// Fallback chain of KNOWN image-output models — try each until one returns an image. (Deliberately does NOT read the
// stale MODEL_IMAGE env, which points at a slug that 404s on OpenRouter. Set MODEL_SCENE to pin a preferred model.)
const SCENE_MODELS = Array.from(new Set([process.env.MODEL_SCENE, 'google/gemini-2.5-flash-image', 'google/gemini-3.1-flash-image', 'openai/gpt-5-image-mini'].filter(Boolean))) as string[]

// Force a full-bleed square with no baked-in text — the two ways an image model wrecks a 1:1 ad creative.
const FRAME =
  ' The photo FILLS THE ENTIRE SQUARE FRAME edge to edge (1:1 aspect). No black bars, no letterbox, no borders, no cinematic bars.' +
  ' Absolutely NO text, NO words, NO letters, NO logos, NO watermark, NO UI. Leave the lower area calmer and less busy for a caption overlay.'

export async function generateScene(prompt: string, refImageUrl?: string | null): Promise<{ dataUri: string; costUsd: number } | null> {
  const key = process.env.OPENROUTER_API_KEY
  if (!key || !prompt) return null
  const text = prompt + FRAME
  const content: any = refImageUrl
    ? [{ type: 'text', text: `${text}\nUse the product/subject from the reference image; place it naturally into the described scene.` }, { type: 'image_url', image_url: { url: refImageUrl } }]
    : text
  // Try each model until one returns an image (a given model can hit a transient "no endpoints" provider gap).
  for (const model of SCENE_MODELS) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content }], modalities: ['image', 'text'], usage: { include: true } }),
      })
      if (!res.ok) continue
      const j: any = await res.json()
      const url: string | undefined = j.choices?.[0]?.message?.images?.[0]?.image_url?.url
      if (url && url.startsWith('data:image')) return { dataUri: url, costUsd: costUsdOf(j) }
    } catch { /* next model */ }
  }
  return null
}

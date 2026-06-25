import { config } from 'dotenv'
config({ path: '.env.local' })

// Can OpenRouter generate the ad image (Nano Banana) — so we skip a separate Venice key?
;(async () => {
  const models = ['google/gemini-2.5-flash-image-preview', 'google/gemini-2.5-flash-image', 'google/gemini-2.0-flash-exp']
  for (const model of models) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          modalities: ['image', 'text'],
          messages: [{ role: 'user', content: 'Generate a clean, high-contrast static Meta ad: bold headline "Stop overpaying for AC repair", modern, scroll-stopping, for an HVAC company.' }],
        }),
      })
      const j: any = await res.json()
      if (!res.ok) { console.log(`${model} ❌ ${res.status} ${JSON.stringify(j).slice(0, 140)}`); continue }
      const img = j.choices?.[0]?.message?.images?.[0]
      const url = img?.image_url?.url || img?.url
      console.log(url ? `${model} ✅ image returned (${String(url).slice(0, 28)}…)` : `${model} ❓ no image field`)
    } catch (e: any) { console.log(`${model} ❌ ${e.message}`) }
  }
})()

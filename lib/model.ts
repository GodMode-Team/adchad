import OpenAI from 'openai'

// OpenRouter is OpenAI-compatible. One key serves the whole bake-off (Hermes-4 / Nemotron / Grok).
// Lazy init so env is loaded first (works in vitest and standalone scripts regardless of import order).
let _client: OpenAI | null = null
function client(): OpenAI {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY, baseURL: 'https://openrouter.ai/api/v1' })
  return _client
}

export async function complete(
  system: string,
  user: string,
  opts: { model?: string; maxTokens?: number; temperature?: number } = {},
): Promise<string> {
  const r = await client().chat.completions.create({
    model: opts.model ?? process.env.MODEL_ROAST!,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    max_tokens: opts.maxTokens ?? 700,
    temperature: opts.temperature ?? 0.7,
  })
  return r.choices[0]?.message?.content ?? ''
}

/** Ask for JSON, strip Hermes <think> traces, return the parsed object. Model-agnostic (no response_format dependency). */
export async function completeJSON<T = any>(
  system: string,
  user: string,
  opts: { model?: string; temperature?: number } = {},
): Promise<T> {
  const txt = await complete(system + '\n\nOutput ONLY a single minified JSON object. No <think>, no markdown, no prose.', user, {
    ...opts,
    temperature: opts.temperature ?? 0.2,
  })
  const cleaned = txt.replace(/<think>[\s\S]*?<\/think>/gi, '')
  const m = cleaned.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('No JSON in model output: ' + txt.slice(0, 200))
  return JSON.parse(m[0]) as T
}

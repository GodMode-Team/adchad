import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'

// Load real creds for live tests (no mocks). .env.local overrides nothing else.
config({ path: '.env.local' })

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 60_000, // live API calls (Foreplay, model, X, Stripe)
    hookTimeout: 60_000,
    fileParallelism: false, // shared DB; run test files serially
  },
})

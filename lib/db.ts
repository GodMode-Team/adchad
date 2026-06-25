import { config } from 'dotenv'
import postgres from 'postgres'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

config({ path: '.env.local' }) // load creds for standalone scripts (vitest loads its own)

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL not set — add it to .env.local (see .env.example)')

export const sql = postgres(url, { onnotice: () => {} })

/** Apply db/schema.sql (idempotent). */
export async function migrate() {
  const schema = readFileSync(join(process.cwd(), 'db/schema.sql'), 'utf8')
  await sql.unsafe(schema)
}

import { migrate, sql } from '../lib/db'

migrate()
  .then(() => console.log('migrated ✓'))
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => sql.end())

/**
 * Standalone migration runner.
 * Used by: npm run db:migrate:run
 * Runs all pending migrations then exits cleanly.
 */
import 'dotenv/config'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import path from 'path'
import { db, pool } from './index'

async function runMigrations() {
  console.log('Running database migrations...')
  await migrate(db, {
    migrationsFolder: path.join(__dirname, 'migrations'),
  })
  console.log('Migrations complete.')
  await pool.end()
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})

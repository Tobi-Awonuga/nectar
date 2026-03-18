import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import path from 'path'
import { env } from './config/env'
import { db, pool } from './db'
import { ensureRolesAndPermissions, ensureAtLeastOneAdmin } from './db/ensureRolesAndPermissions'
import { ensureSystemWorkflowCatalog } from './db/systemWorkflowCatalog'
import router from './routes'
import { errorHandler } from './middleware/error.middleware'

const app = express()

app.use(helmet())
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'nectar-backend',
    env: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

app.use('/api', router)

app.use(errorHandler)

async function bootstrap() {
  console.log('Running database migrations...')
  await migrate(db, {
    migrationsFolder: path.join(__dirname, 'db', 'migrations'),
  })
  console.log('Migrations complete.')

  console.log('Ensuring roles and permissions...')
  await ensureRolesAndPermissions()
  await ensureAtLeastOneAdmin()
  console.log('Roles and permissions ready.')

  console.log('Ensuring system workflow catalog...')
  await ensureSystemWorkflowCatalog()
  console.log('System workflow catalog ready.')

  app.listen(env.PORT, () => {
    console.log(`Nectar backend running on port ${env.PORT} [${env.NODE_ENV}]`)
  })
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err)
  pool.end()
  process.exit(1)
})

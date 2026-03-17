import * as dotenv from 'dotenv'
import path from 'path'
import type { Config } from 'drizzle-kit'

// drizzle-kit runs from backend/ — root .env is one level up
dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config() // fallback

export default {
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config

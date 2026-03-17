import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const onboardingRequests = pgTable('onboarding_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  // 'pending' | 'approved' | 'rejected'
  notes: text('notes'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type OnboardingRequest = typeof onboardingRequests.$inferSelect
export type NewOnboardingRequest = typeof onboardingRequests.$inferInsert

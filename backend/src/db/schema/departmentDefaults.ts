import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const departmentDefaultAssignees = pgTable('department_default_assignees', {
  id: uuid('id').defaultRandom().primaryKey(),
  department: varchar('department', { length: 100 }).notNull().unique(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  updatedBy: uuid('updated_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type DepartmentDefaultAssignee = typeof departmentDefaultAssignees.$inferSelect
export type NewDepartmentDefaultAssignee = typeof departmentDefaultAssignees.$inferInsert

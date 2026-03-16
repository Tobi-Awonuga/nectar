import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { users } from './users'
import { roles } from './roles'

// The process template — defines what a workflow looks like
export const workflows = pgTable('workflows', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

// The possible states within a workflow
export const workflowStates = pgTable('workflow_states', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowId: uuid('workflow_id')
    .notNull()
    .references(() => workflows.id, { onDelete: 'cascade' }),
  // Machine name used in code — e.g. 'draft', 'submitted', 'approved'
  name: varchar('name', { length: 100 }).notNull(),
  // Display label in the UI — e.g. 'Draft', 'Awaiting Approval', 'Approved'
  label: varchar('label', { length: 100 }).notNull(),
  isInitial: boolean('is_initial').default(false).notNull(),
  isFinal: boolean('is_final').default(false).notNull(),
  // Maps to shadcn Badge variant / Tailwind color — e.g. 'slate', 'yellow', 'green', 'red'
  color: varchar('color', { length: 50 }),
  // Ordering for kanban / progress display
  position: integer('position').notNull(),
})

// The edges of the state machine — how states connect
export const workflowTransitions = pgTable('workflow_transitions', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowId: uuid('workflow_id')
    .notNull()
    .references(() => workflows.id, { onDelete: 'cascade' }),
  fromStateId: uuid('from_state_id')
    .notNull()
    .references(() => workflowStates.id),
  toStateId: uuid('to_state_id')
    .notNull()
    .references(() => workflowStates.id),
  // Machine name — e.g. 'submit', 'approve', 'reject'
  actionName: varchar('action_name', { length: 100 }).notNull(),
  // Display label — e.g. 'Submit', 'Approve', 'Reject'
  actionLabel: varchar('action_label', { length: 100 }).notNull(),
})

// Which roles are allowed to fire each transition (replaces single role_required column)
export const transitionAllowedRoles = pgTable(
  'transition_allowed_roles',
  {
    transitionId: uuid('transition_id')
      .notNull()
      .references(() => workflowTransitions.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.transitionId, table.roleId] }),
  }),
)

export type Workflow = typeof workflows.$inferSelect
export type NewWorkflow = typeof workflows.$inferInsert
export type WorkflowState = typeof workflowStates.$inferSelect
export type WorkflowTransition = typeof workflowTransitions.$inferSelect

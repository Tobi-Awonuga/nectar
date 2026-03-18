import { pgTable, uuid, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { users } from './users'
import { workflows, workflowStates } from './workflows'

// A running execution of a workflow template
export const workflowInstances = pgTable('workflow_instances', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowId: uuid('workflow_id')
    .notNull()
    .references(() => workflows.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  currentStateId: uuid('current_state_id')
    .notNull()
    .references(() => workflowStates.id),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  // Current responsible party — updated as state changes
  assignedTo: uuid('assigned_to').references(() => users.id),
  // Department that owns this request (routes to their queue)
  ownerDepartment: varchar('owner_department', { length: 100 }),
  ownerUserId: uuid('owner_user_id').references(() => users.id),
  // 'public' | 'private' — private requests are only visible to sender and recipient
  visibility: varchar('visibility', { length: 20 }).default('public').notNull(),
  // 'low' | 'medium' | 'high' | 'critical'
  priority: varchar('priority', { length: 50 }).default('medium').notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  // Flexible domain-specific data — varies by workflow type
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

// Immutable audit log — every action recorded, nothing ever updated or deleted here
export const workflowEvents = pgTable('workflow_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  instanceId: uuid('instance_id')
    .notNull()
    .references(() => workflowInstances.id),
  // 'state_changed' | 'assigned' | 'commented' | 'created' | 'completed'
  eventType: varchar('event_type', { length: 100 }).notNull(),
  fromStateId: uuid('from_state_id').references(() => workflowStates.id),
  toStateId: uuid('to_state_id').references(() => workflowStates.id),
  performedBy: uuid('performed_by')
    .notNull()
    .references(() => users.id),
  // Optional note attached to this audit event — e.g. "Rejected: budget exceeded"
  comment: text('comment'),
  metadata: jsonb('metadata'),
  // No updatedAt — this record is intentionally immutable
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Full assignment history — who held the instance and when
export const instanceAssignments = pgTable('instance_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  instanceId: uuid('instance_id')
    .notNull()
    .references(() => workflowInstances.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  assignedBy: uuid('assigned_by')
    .notNull()
    .references(() => users.id),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
})

export const requestParticipants = pgTable('request_participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  instanceId: uuid('instance_id')
    .notNull()
    .references(() => workflowInstances.id, { onDelete: 'cascade' }),
  participantType: varchar('participant_type', { length: 20 }).notNull(),
  participantScope: varchar('participant_scope', { length: 20 }).notNull(),
  department: varchar('department', { length: 100 }),
  userId: uuid('user_id').references(() => users.id),
  addedBy: uuid('added_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type WorkflowInstance = typeof workflowInstances.$inferSelect
export type NewWorkflowInstance = typeof workflowInstances.$inferInsert
export type WorkflowEvent = typeof workflowEvents.$inferSelect
export type NewWorkflowEvent = typeof workflowEvents.$inferInsert
export type RequestParticipant = typeof requestParticipants.$inferSelect
export type NewRequestParticipant = typeof requestParticipants.$inferInsert

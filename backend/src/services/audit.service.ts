import { alias } from 'drizzle-orm/pg-core'
import { desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { workflowEvents, workflowInstances, workflowStates, users } from '../db/schema'

// Enriched type returned from audit queries
export interface AuditEvent {
  id: string
  instanceId: string
  instanceTitle: string | null
  eventType: string
  fromStateLabel: string | null
  toStateLabel: string | null
  performedBy: string
  performerName: string | null
  comment: string | null
  createdAt: Date
}

export async function getAll(_query: Record<string, unknown>): Promise<AuditEvent[]> {
  const fromState = alias(workflowStates, 'from_state')
  const toState = alias(workflowStates, 'to_state')
  const performer = alias(users, 'performer')

  return db
    .select({
      id: workflowEvents.id,
      instanceId: workflowEvents.instanceId,
      instanceTitle: workflowInstances.title,
      eventType: workflowEvents.eventType,
      fromStateLabel: fromState.label,
      toStateLabel: toState.label,
      performedBy: workflowEvents.performedBy,
      performerName: performer.name,
      comment: workflowEvents.comment,
      createdAt: workflowEvents.createdAt,
    })
    .from(workflowEvents)
    .leftJoin(workflowInstances, eq(workflowEvents.instanceId, workflowInstances.id))
    .leftJoin(fromState, eq(workflowEvents.fromStateId, fromState.id))
    .leftJoin(toState, eq(workflowEvents.toStateId, toState.id))
    .leftJoin(performer, eq(workflowEvents.performedBy, performer.id))
    .orderBy(desc(workflowEvents.createdAt))
}

export async function getByInstance(instanceId: string): Promise<AuditEvent[]> {
  const fromState = alias(workflowStates, 'from_state')
  const toState = alias(workflowStates, 'to_state')
  const performer = alias(users, 'performer')

  return db
    .select({
      id: workflowEvents.id,
      instanceId: workflowEvents.instanceId,
      instanceTitle: workflowInstances.title,
      eventType: workflowEvents.eventType,
      fromStateLabel: fromState.label,
      toStateLabel: toState.label,
      performedBy: workflowEvents.performedBy,
      performerName: performer.name,
      comment: workflowEvents.comment,
      createdAt: workflowEvents.createdAt,
    })
    .from(workflowEvents)
    .leftJoin(workflowInstances, eq(workflowEvents.instanceId, workflowInstances.id))
    .leftJoin(fromState, eq(workflowEvents.fromStateId, fromState.id))
    .leftJoin(toState, eq(workflowEvents.toStateId, toState.id))
    .leftJoin(performer, eq(workflowEvents.performedBy, performer.id))
    .where(eq(workflowEvents.instanceId, instanceId))
    .orderBy(desc(workflowEvents.createdAt))
}

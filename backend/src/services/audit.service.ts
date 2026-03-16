import { db } from '../db'
import { workflowEvents } from '../db/schema'
import type { WorkflowEvent } from '../db/schema'

export async function getAll(_query: Record<string, unknown>): Promise<WorkflowEvent[]> {
  // TODO: parse filters from query (userId/performedBy, eventType, fromDate, toDate, pagination)
  // return db.select().from(workflowEvents) with appropriate where clauses
  void db
  void workflowEvents
  return []
}

export async function getByInstance(instanceId: string): Promise<WorkflowEvent[]> {
  // TODO: return db.select().from(workflowEvents)
  //   .where(eq(workflowEvents.instanceId, instanceId))
  //   .orderBy(asc(workflowEvents.createdAt))
  void instanceId
  return []
}

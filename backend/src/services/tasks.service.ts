import { db } from '../db'
import { workflowInstances } from '../db/schema'
import type { WorkflowInstance, NewWorkflowInstance } from '../db/schema'

export async function getAll(_query: Record<string, unknown>): Promise<WorkflowInstance[]> {
  // TODO: parse pagination/filter params, return db.select().from(workflowInstances).where(isNull(workflowInstances.deletedAt))
  void db
  void workflowInstances
  return []
}

export async function create(
  data: Omit<NewWorkflowInstance, 'createdBy'>,
  createdBy: string,
): Promise<WorkflowInstance> {
  // TODO: return db.insert(workflowInstances).values({ ...data, createdBy }).returning()
  void data
  void createdBy
  throw new Error('Not implemented')
}

export async function getById(id: string): Promise<WorkflowInstance | null> {
  // TODO: return db.select().from(workflowInstances).where(and(eq(workflowInstances.id, id), isNull(workflowInstances.deletedAt))).limit(1)
  void id
  return null
}

export async function update(
  id: string,
  data: Partial<WorkflowInstance>,
): Promise<WorkflowInstance | null> {
  // TODO: return db.update(workflowInstances).set({ ...data, updatedAt: new Date() }).where(eq(workflowInstances.id, id)).returning()
  void id
  void data
  return null
}

export async function remove(id: string): Promise<void> {
  // TODO: db.update(workflowInstances).set({ deletedAt: new Date() }).where(eq(workflowInstances.id, id))
  void id
}

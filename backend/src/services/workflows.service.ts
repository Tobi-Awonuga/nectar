import { db } from '../db'
import {
  workflows,
  workflowStates,
  workflowTransitions,
  workflowInstances,
  workflowEvents,
} from '../db/schema'
import type {
  Workflow,
  NewWorkflow,
  WorkflowState,
  WorkflowTransition,
  WorkflowInstance,
} from '../db/schema'

export async function getAll(_query: Record<string, unknown>): Promise<Workflow[]> {
  // TODO: return db.select().from(workflows).where(isNull(workflows.deletedAt))
  void db
  void workflows
  return []
}

export async function create(data: Omit<NewWorkflow, 'createdBy'>, createdBy: string): Promise<Workflow> {
  // TODO: return db.insert(workflows).values({ ...data, createdBy }).returning()
  void data
  void createdBy
  throw new Error('Not implemented')
}

export async function getById(id: string): Promise<Workflow | null> {
  // TODO: return db.select().from(workflows).where(and(eq(workflows.id, id), isNull(workflows.deletedAt))).limit(1)
  void id
  return null
}

export async function update(id: string, data: Partial<Workflow>): Promise<Workflow | null> {
  // TODO: return db.update(workflows).set({ ...data, updatedAt: new Date() }).where(eq(workflows.id, id)).returning()
  void id
  void data
  return null
}

export async function remove(id: string): Promise<void> {
  // TODO: db.update(workflows).set({ deletedAt: new Date() }).where(eq(workflows.id, id))
  void id
}

export async function getStates(workflowId: string): Promise<WorkflowState[]> {
  // TODO: return db.select().from(workflowStates).where(eq(workflowStates.workflowId, workflowId)).orderBy(workflowStates.position)
  void workflowStates
  void workflowId
  return []
}

export async function getTransitions(workflowId: string): Promise<WorkflowTransition[]> {
  // TODO: return db.select().from(workflowTransitions).where(eq(workflowTransitions.workflowId, workflowId))
  void workflowTransitions
  void workflowId
  return []
}

export async function transitionState(
  instanceId: string,
  actionName: string,
  userId: string,
): Promise<WorkflowInstance> {
  // TODO:
  // 1. Load instance and current state
  // 2. Find valid transition matching actionName from current state
  // 3. Check user role is in transition_allowed_roles
  // 4. Update instance.currentStateId
  // 5. Insert workflow_event record (immutable audit entry)
  // 6. Trigger notifications
  // 7. Return updated instance
  void workflowInstances
  void workflowEvents
  void instanceId
  void actionName
  void userId
  throw new Error('Not implemented')
}

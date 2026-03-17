import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '../db'
import {
  transitionAllowedRoles,
  userRoles,
  workflowEvents,
  workflowInstances,
  workflows,
  workflowStates,
  workflowTransitions,
} from '../db/schema'
import type {
  NewWorkflow,
  Workflow,
  WorkflowInstance,
  WorkflowState,
  WorkflowTransition,
} from '../db/schema'

type AppError = Error & { statusCode?: number }

function createError(message: string, statusCode: number): AppError {
  const err = new Error(message) as AppError
  err.statusCode = statusCode
  return err
}

export interface WorkflowTemplate extends Workflow {
  states: WorkflowState[]
  transitions: WorkflowTransition[]
}

export async function getAll(_query: Record<string, unknown>): Promise<WorkflowTemplate[]> {
  const rows = await db
    .select()
    .from(workflows)
    .where(and(eq(workflows.isActive, true), isNull(workflows.deletedAt)))
    .orderBy(desc(workflows.createdAt))

  if (rows.length === 0) return []

  const workflowIds = rows.map((row) => row.id)
  const [states, transitions] = await Promise.all([
    db
      .select()
      .from(workflowStates)
      .where(inArray(workflowStates.workflowId, workflowIds))
      .orderBy(asc(workflowStates.position)),
    db
      .select()
      .from(workflowTransitions)
      .where(inArray(workflowTransitions.workflowId, workflowIds)),
  ])

  const statesByWorkflow = new Map<string, WorkflowState[]>()
  for (const state of states) {
    const current = statesByWorkflow.get(state.workflowId) ?? []
    current.push(state)
    statesByWorkflow.set(state.workflowId, current)
  }

  const transitionsByWorkflow = new Map<string, WorkflowTransition[]>()
  for (const transition of transitions) {
    const current = transitionsByWorkflow.get(transition.workflowId) ?? []
    current.push(transition)
    transitionsByWorkflow.set(transition.workflowId, current)
  }

  return rows.map((row) => ({
    ...row,
    states: statesByWorkflow.get(row.id) ?? [],
    transitions: transitionsByWorkflow.get(row.id) ?? [],
  }))
}

export async function create(
  data: Omit<NewWorkflow, 'createdBy'>,
  createdBy: string,
): Promise<Workflow> {
  if (!createdBy) {
    throw createError('Missing authenticated user', 401)
  }

  if (!data.name?.trim()) {
    throw createError('Workflow name is required', 400)
  }

  const [created] = await db
    .insert(workflows)
    .values({
      name: data.name.trim(),
      description: data.description ?? null,
      isActive: data.isActive ?? true,
      createdBy,
    })
    .returning()

  return created
}

export async function getById(id: string): Promise<WorkflowTemplate | null> {
  const [workflow] = await db
    .select()
    .from(workflows)
    .where(and(eq(workflows.id, id), eq(workflows.isActive, true), isNull(workflows.deletedAt)))
    .limit(1)

  if (!workflow) return null

  const [states, transitions] = await Promise.all([
    db
      .select()
      .from(workflowStates)
      .where(eq(workflowStates.workflowId, id))
      .orderBy(asc(workflowStates.position)),
    db
      .select()
      .from(workflowTransitions)
      .where(eq(workflowTransitions.workflowId, id)),
  ])

  return { ...workflow, states, transitions }
}

export async function update(
  id: string,
  data: Partial<Pick<Workflow, 'name' | 'description' | 'isActive'>>,
): Promise<Workflow | null> {
  const updateData: Partial<Pick<Workflow, 'name' | 'description' | 'isActive' | 'updatedAt'>> = {
    updatedAt: new Date(),
  }

  if (typeof data.name === 'string') updateData.name = data.name.trim()
  if (typeof data.description !== 'undefined') updateData.description = data.description
  if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive

  const [updated] = await db
    .update(workflows)
    .set(updateData)
    .where(and(eq(workflows.id, id), isNull(workflows.deletedAt)))
    .returning()

  return updated ?? null
}

export async function remove(id: string): Promise<void> {
  await db
    .update(workflows)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(workflows.id, id), isNull(workflows.deletedAt)))
}

export async function getStates(workflowId: string): Promise<WorkflowState[]> {
  return db
    .select()
    .from(workflowStates)
    .where(eq(workflowStates.workflowId, workflowId))
    .orderBy(asc(workflowStates.position))
}

export async function getTransitions(workflowId: string): Promise<WorkflowTransition[]> {
  return db
    .select()
    .from(workflowTransitions)
    .where(eq(workflowTransitions.workflowId, workflowId))
}

export async function transitionState(
  instanceId: string,
  actionName: string,
  userId: string,
  comment?: string,
): Promise<WorkflowInstance> {
  if (!actionName?.trim()) {
    throw createError('actionName is required', 400)
  }

  const [instance] = await db
    .select()
    .from(workflowInstances)
    .where(and(eq(workflowInstances.id, instanceId), isNull(workflowInstances.deletedAt)))
    .limit(1)

  if (!instance) {
    throw createError('Workflow instance not found', 404)
  }

  const [transition] = await db
    .select()
    .from(workflowTransitions)
    .where(
      and(
        eq(workflowTransitions.workflowId, instance.workflowId),
        eq(workflowTransitions.fromStateId, instance.currentStateId),
        eq(workflowTransitions.actionName, actionName.trim()),
      ),
    )
    .limit(1)

  if (!transition) {
    throw createError('Invalid transition from current state', 400)
  }

  const roleRows = await db
    .select({ roleId: userRoles.roleId })
    .from(userRoles)
    .where(eq(userRoles.userId, userId))
  const roleIds = roleRows.map((row) => row.roleId)

  if (roleIds.length === 0) {
    throw createError('User has no assigned roles', 403)
  }

  const allowedRows = await db
    .select()
    .from(transitionAllowedRoles)
    .where(
      and(
        eq(transitionAllowedRoles.transitionId, transition.id),
        inArray(transitionAllowedRoles.roleId, roleIds),
      ),
    )
    .limit(1)

  if (allowedRows.length === 0) {
    throw createError('Not authorized for this transition', 403)
  }

  const [toState] = await db
    .select({ isFinal: workflowStates.isFinal })
    .from(workflowStates)
    .where(eq(workflowStates.id, transition.toStateId))
    .limit(1)

  const [updated] = await db
    .update(workflowInstances)
    .set({
      currentStateId: transition.toStateId,
      updatedAt: new Date(),
      completedAt: toState?.isFinal ? new Date() : null,
    })
    .where(eq(workflowInstances.id, instance.id))
    .returning()

  if (!updated) {
    throw createError('Failed to update workflow instance', 500)
  }

  await db.insert(workflowEvents).values({
    instanceId: instance.id,
    eventType: 'state_changed',
    fromStateId: instance.currentStateId,
    toStateId: transition.toStateId,
    performedBy: userId,
    comment: comment ?? null,
  })

  return updated
}

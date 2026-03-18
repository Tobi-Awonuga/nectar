import { and, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '../db'
import { transitionAllowedRoles, userRoles, users, workflowInstances, workflowStates, workflowTransitions } from '../db/schema'
import type { WorkflowInstance } from '../db/schema'
import * as workflowsService from './workflows.service'

export interface ApprovalActionOptions {
  comment?: string
}

export interface PendingApproval extends WorkflowInstance {
  currentState: { id: string; label: string; color: string | null } | null
  createdByUser: { id: string; name: string } | null
}

export async function getPending(userId: string): Promise<PendingApproval[]> {
  // Get user's roles
  const userRoleRows = await db
    .select({ roleId: userRoles.roleId })
    .from(userRoles)
    .where(eq(userRoles.userId, userId))

  if (userRoleRows.length === 0) return []

  const roleIds = userRoleRows.map((r) => r.roleId)

  // Find all from-states where the user's roles have allowed transitions
  const allowedTransitionRows = await db
    .select({ fromStateId: workflowTransitions.fromStateId })
    .from(transitionAllowedRoles)
    .innerJoin(workflowTransitions, eq(workflowTransitions.id, transitionAllowedRoles.transitionId))
    .where(inArray(transitionAllowedRoles.roleId, roleIds))

  if (allowedTransitionRows.length === 0) return []

  const actionableStateIds = [...new Set(allowedTransitionRows.map((t) => t.fromStateId))]

  // Get open instances currently in those actionable states
  const instances = await db
    .select()
    .from(workflowInstances)
    .where(
      and(
        isNull(workflowInstances.deletedAt),
        isNull(workflowInstances.completedAt),
        inArray(workflowInstances.currentStateId, actionableStateIds),
      ),
    )

  if (instances.length === 0) return []

  // Batch-load states and submitter names
  const stateIds = [...new Set(instances.map((i) => i.currentStateId))]
  const creatorIds = [...new Set(instances.map((i) => i.createdBy).filter(Boolean))] as string[]

  const [stateRows, creatorRows] = await Promise.all([
    db.select({ id: workflowStates.id, label: workflowStates.label, color: workflowStates.color })
      .from(workflowStates)
      .where(inArray(workflowStates.id, stateIds)),
    creatorIds.length > 0
      ? db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, creatorIds))
      : Promise.resolve([]),
  ])

  const stateMap = Object.fromEntries(stateRows.map((s) => [s.id, s]))
  const creatorMap = Object.fromEntries(creatorRows.map((u) => [u.id, u]))

  return instances.map((instance) => ({
    ...instance,
    currentState: stateMap[instance.currentStateId] ?? null,
    createdByUser: instance.createdBy ? (creatorMap[instance.createdBy] ?? null) : null,
  }))
}

export async function approve(
  instanceId: string,
  userId: string,
  options: ApprovalActionOptions,
): Promise<WorkflowInstance> {
  return workflowsService.transitionState(instanceId, 'approve', userId, options.comment)
}

export async function reject(
  instanceId: string,
  userId: string,
  options: ApprovalActionOptions,
): Promise<WorkflowInstance> {
  return workflowsService.transitionState(instanceId, 'reject', userId, options.comment)
}

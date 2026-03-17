import { and, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '../db'
import { transitionAllowedRoles, userRoles, workflowInstances, workflowStates, workflowTransitions } from '../db/schema'
import type { WorkflowInstance } from '../db/schema'
import * as workflowsService from './workflows.service'

export interface ApprovalActionOptions {
  comment?: string
}

export interface PendingApproval extends WorkflowInstance {
  currentState: { id: string; label: string; color: string | null } | null
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

  const result: PendingApproval[] = []
  for (const instance of instances) {
    const [state] = await db
      .select({ id: workflowStates.id, label: workflowStates.label, color: workflowStates.color })
      .from(workflowStates)
      .where(eq(workflowStates.id, instance.currentStateId))
      .limit(1)

    result.push({ ...instance, currentState: state ?? null })
  }

  return result
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

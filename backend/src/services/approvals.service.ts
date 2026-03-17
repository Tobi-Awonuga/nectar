import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../db'
import { workflowInstances, workflowStates } from '../db/schema'
import type { WorkflowInstance } from '../db/schema'
import * as workflowsService from './workflows.service'

export interface ApprovalActionOptions {
  comment?: string
}

export interface PendingApproval extends WorkflowInstance {
  currentState: { id: string; label: string; color: string | null } | null
}

export async function getPending(userId: string): Promise<PendingApproval[]> {
  void userId
  const instances = await db
    .select()
    .from(workflowInstances)
    .where(
      and(
        isNull(workflowInstances.deletedAt),
        isNull(workflowInstances.completedAt),
      ),
    )

  if (instances.length === 0) return []

  // Enrich with current state label for each instance
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

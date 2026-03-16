import { db } from '../db'
import { workflowInstances } from '../db/schema'
import type { WorkflowInstance } from '../db/schema'

export interface ApprovalActionOptions {
  comment?: string
}

export async function getPending(userId: string): Promise<WorkflowInstance[]> {
  // TODO: query workflow instances where current state is an approval state
  // and the assigned user or user's role is responsible for the transition
  void db
  void workflowInstances
  void userId
  return []
}

export async function approve(
  instanceId: string,
  userId: string,
  options: ApprovalActionOptions,
): Promise<WorkflowInstance> {
  // TODO: call workflowsService.transitionState with the appropriate 'approve' actionName
  // and record the optional comment in the workflow event
  void instanceId
  void userId
  void options
  throw new Error('Not implemented')
}

export async function reject(
  instanceId: string,
  userId: string,
  options: ApprovalActionOptions,
): Promise<WorkflowInstance> {
  // TODO: call workflowsService.transitionState with the appropriate 'reject' actionName
  // and record the optional comment in the workflow event
  void instanceId
  void userId
  void options
  throw new Error('Not implemented')
}

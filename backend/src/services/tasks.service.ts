import { and, asc, desc, eq, isNull, or } from 'drizzle-orm'
import { db } from '../db'
import {
  instanceAssignments,
  workflowEvents,
  workflowInstances,
  workflows,
  workflowStates,
} from '../db/schema'
import type { WorkflowInstance } from '../db/schema'
import * as notificationsService from './notifications.service'

type AppError = Error & { statusCode?: number }

function createError(message: string, statusCode: number): AppError {
  const err = new Error(message) as AppError
  err.statusCode = statusCode
  return err
}

interface CreateTaskInput {
  workflowId: string
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  dueDate?: string
  metadata?: Record<string, unknown>
  ownerDepartment?: string
  visibility?: 'public' | 'private'
  privateRecipientId?: string
}

export async function getAll(userId: string, _query: Record<string, unknown>): Promise<WorkflowInstance[]> {
  // Public requests: user created or assigned, excluding private ones not addressed to them
  return db
    .select()
    .from(workflowInstances)
    .where(
      and(
        isNull(workflowInstances.deletedAt),
        or(
          eq(workflowInstances.createdBy, userId),
          eq(workflowInstances.assignedTo, userId),
        ),
        // Exclude private requests unless the user is sender or recipient
        or(
          eq(workflowInstances.visibility, 'public'),
          eq(workflowInstances.createdBy, userId),
          eq(workflowInstances.assignedTo, userId),
        ),
      ),
    )
    .orderBy(desc(workflowInstances.createdAt))
}

export async function getPrivate(userId: string): Promise<WorkflowInstance[]> {
  return db
    .select()
    .from(workflowInstances)
    .where(
      and(
        isNull(workflowInstances.deletedAt),
        eq(workflowInstances.visibility, 'private'),
        or(
          eq(workflowInstances.createdBy, userId),
          eq(workflowInstances.assignedTo, userId),
        ),
      ),
    )
    .orderBy(desc(workflowInstances.createdAt))
}

export async function create(
  data: CreateTaskInput,
  createdBy: string,
): Promise<WorkflowInstance> {
  if (!createdBy) {
    throw createError('Missing authenticated user', 401)
  }

  if (!data.workflowId || !data.title?.trim()) {
    throw createError('workflowId and title are required', 400)
  }

  const [workflow] = await db
    .select({ id: workflows.id })
    .from(workflows)
    .where(and(eq(workflows.id, data.workflowId), eq(workflows.isActive, true), isNull(workflows.deletedAt)))
    .limit(1)

  if (!workflow) {
    throw createError('Workflow not found', 404)
  }

  let [initialState] = await db
    .select()
    .from(workflowStates)
    .where(and(eq(workflowStates.workflowId, workflow.id), eq(workflowStates.isInitial, true)))
    .orderBy(asc(workflowStates.position))
    .limit(1)

  if (!initialState) {
    ;[initialState] = await db
      .select()
      .from(workflowStates)
      .where(eq(workflowStates.workflowId, workflow.id))
      .orderBy(asc(workflowStates.position))
      .limit(1)
  }

  if (!initialState) {
    throw createError('Workflow has no states configured', 400)
  }

  const isPrivate = data.visibility === 'private'
  const assignedTo = isPrivate && data.privateRecipientId ? data.privateRecipientId : createdBy

  const [created] = await db
    .insert(workflowInstances)
    .values({
      workflowId: workflow.id,
      title: data.title.trim(),
      description: data.description ?? null,
      currentStateId: initialState.id,
      createdBy,
      assignedTo,
      ownerDepartment: data.ownerDepartment ?? null,
      visibility: data.visibility ?? 'public',
      priority: data.priority ?? 'medium',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      metadata: data.metadata ?? {},
    })
    .returning()

  await db.insert(workflowEvents).values({
    instanceId: created.id,
    eventType: 'created',
    toStateId: initialState.id,
    performedBy: createdBy,
    metadata: {
      source: 'api',
      workflowId: workflow.id,
    },
  })

  // Record initial assignment
  await db.insert(instanceAssignments).values({
    instanceId: created.id,
    userId: createdBy,
    assignedBy: createdBy,
  })

  // Notify the requester
  await notificationsService.create({
    userId: createdBy,
    type: 'task_assigned',
    title: 'Request submitted',
    message: `Your request "${created.title}" has been submitted successfully.`,
    entityType: 'workflow_instance',
    entityId: created.id,
  })

  return created
}

export async function getById(id: string): Promise<WorkflowInstance | null> {
  const [instance] = await db
    .select()
    .from(workflowInstances)
    .where(and(eq(workflowInstances.id, id), isNull(workflowInstances.deletedAt)))
    .limit(1)

  return instance ?? null
}

export async function update(
  id: string,
  data: Partial<Pick<WorkflowInstance, 'title' | 'description' | 'priority' | 'assignedTo' | 'metadata' | 'dueDate'>>,
): Promise<WorkflowInstance | null> {
  const updateData: Partial<
    Pick<WorkflowInstance, 'title' | 'description' | 'priority' | 'assignedTo' | 'metadata' | 'dueDate' | 'updatedAt'>
  > = {
    updatedAt: new Date(),
  }

  if (typeof data.title === 'string') updateData.title = data.title.trim()
  if (typeof data.description !== 'undefined') updateData.description = data.description
  if (typeof data.priority !== 'undefined') updateData.priority = data.priority
  if (typeof data.assignedTo !== 'undefined') updateData.assignedTo = data.assignedTo
  if (typeof data.metadata !== 'undefined') updateData.metadata = data.metadata
  if (typeof data.dueDate !== 'undefined') updateData.dueDate = data.dueDate

  const [updated] = await db
    .update(workflowInstances)
    .set(updateData)
    .where(and(eq(workflowInstances.id, id), isNull(workflowInstances.deletedAt)))
    .returning()

  return updated ?? null
}

export async function remove(id: string): Promise<void> {
  await db
    .update(workflowInstances)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(workflowInstances.id, id), isNull(workflowInstances.deletedAt)))
}

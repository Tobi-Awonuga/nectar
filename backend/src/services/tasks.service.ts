import { and, asc, desc, eq, inArray, isNull, or } from 'drizzle-orm'
import { db } from '../db'
import {
  instanceAssignments,
  requestParticipants,
  users,
  workflowEvents,
  workflowInstances,
  workflows,
  workflowStates,
} from '../db/schema'
import type { WorkflowInstance } from '../db/schema'
import * as notificationsService from './notifications.service'

type AppError = Error & { statusCode?: number }

interface RequestUser {
  id: string
  name: string
  email: string
  department: string | null
}

export interface WorkflowInstanceRecord extends WorkflowInstance {
  ownerUser?: RequestUser | null
  watchingDepartments: string[]
}

interface CreateTaskInput {
  workflowId: string
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  dueDate?: string
  metadata?: Record<string, unknown>
  ownerDepartment?: string
  ownerUserId?: string
  visibility?: 'public' | 'private'
  privateRecipientId?: string
  watchingDepartments?: string[]
}

type UpdateTaskInput = Partial<
  Pick<
    WorkflowInstance,
    'title' | 'description' | 'priority' | 'assignedTo' | 'metadata' | 'dueDate' | 'ownerDepartment' | 'ownerUserId'
  >
> & {
  watchingDepartments?: string[]
}

function createError(message: string, statusCode: number): AppError {
  const err = new Error(message) as AppError
  err.statusCode = statusCode
  return err
}

async function attachRequestRelations(instances: WorkflowInstance[]): Promise<WorkflowInstanceRecord[]> {
  if (instances.length === 0) return []

  const instanceIds = instances.map((instance) => instance.id)
  const ownerUserIds = [...new Set(instances.map((instance) => instance.ownerUserId).filter(Boolean))] as string[]

  const [ownerUsers, participants] = await Promise.all([
    ownerUserIds.length > 0
      ? db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            department: users.department,
          })
          .from(users)
          .where(inArray(users.id, ownerUserIds))
      : Promise.resolve([]),
    db
      .select({
        instanceId: requestParticipants.instanceId,
        participantType: requestParticipants.participantType,
        participantScope: requestParticipants.participantScope,
        department: requestParticipants.department,
      })
      .from(requestParticipants)
      .where(inArray(requestParticipants.instanceId, instanceIds)),
  ])

  const ownerUserById = new Map(ownerUsers.map((user) => [user.id, user]))
  const watchingDepartmentsByInstance = new Map<string, string[]>()

  for (const participant of participants) {
    if (
      participant.participantType === 'watching' &&
      participant.participantScope === 'department' &&
      participant.department
    ) {
      const current = watchingDepartmentsByInstance.get(participant.instanceId) ?? []
      if (!current.includes(participant.department)) {
        current.push(participant.department)
        watchingDepartmentsByInstance.set(participant.instanceId, current)
      }
    }
  }

  return instances.map((instance) => ({
    ...instance,
    ownerUser: instance.ownerUserId ? (ownerUserById.get(instance.ownerUserId) ?? null) : null,
    watchingDepartments: watchingDepartmentsByInstance.get(instance.id) ?? [],
  }))
}

async function resolveOwner(
  ownerUserId: string | null | undefined,
  ownerDepartment: string | null | undefined,
): Promise<{ ownerUserId: string | null; ownerDepartment: string | null }> {
  if (!ownerUserId) {
    return { ownerUserId: null, ownerDepartment: ownerDepartment ?? null }
  }

  const [ownerUser] = await db
    .select({
      id: users.id,
      department: users.department,
      isActive: users.isActive,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(eq(users.id, ownerUserId))
    .limit(1)

  if (!ownerUser || ownerUser.deletedAt || !ownerUser.isActive) {
    throw createError('Owner user not found', 404)
  }

  if (ownerDepartment && ownerUser.department && ownerUser.department !== ownerDepartment) {
    throw createError('Owner user must belong to the owning department', 400)
  }

  return {
    ownerUserId: ownerUser.id,
    ownerDepartment: ownerDepartment ?? ownerUser.department ?? null,
  }
}

async function replaceWatchingDepartments(
  instanceId: string,
  watchingDepartments: string[],
  addedBy: string,
): Promise<void> {
  await db
    .delete(requestParticipants)
    .where(
      and(
        eq(requestParticipants.instanceId, instanceId),
        eq(requestParticipants.participantType, 'watching'),
        eq(requestParticipants.participantScope, 'department'),
      ),
    )

  const uniqueDepartments = [...new Set(watchingDepartments.map((department) => department.trim()).filter(Boolean))]
  if (uniqueDepartments.length === 0) return

  await db.insert(requestParticipants).values(
    uniqueDepartments.map((department) => ({
      instanceId,
      participantType: 'watching',
      participantScope: 'department',
      department,
      addedBy,
    })),
  )
}

export async function getAll(userId: string, _query: Record<string, unknown>): Promise<WorkflowInstanceRecord[]> {
  const instances = await db
    .select()
    .from(workflowInstances)
    .where(
      and(
        isNull(workflowInstances.deletedAt),
        or(eq(workflowInstances.createdBy, userId), eq(workflowInstances.assignedTo, userId)),
        or(
          eq(workflowInstances.visibility, 'public'),
          eq(workflowInstances.createdBy, userId),
          eq(workflowInstances.assignedTo, userId),
        ),
      ),
    )
    .orderBy(desc(workflowInstances.createdAt))

  return attachRequestRelations(instances)
}

export async function getDepartmentQueue(
  userId: string,
): Promise<{ department: string | null; instances: WorkflowInstanceRecord[] }> {
  const [user] = await db
    .select({ department: users.department })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const department = user?.department ?? null
  if (!department) return { department: null, instances: [] }

  const instances = await db
    .select()
    .from(workflowInstances)
    .where(
      and(
        isNull(workflowInstances.deletedAt),
        eq(workflowInstances.ownerDepartment, department),
        eq(workflowInstances.visibility, 'public'),
      ),
    )
    .orderBy(desc(workflowInstances.createdAt))

  return { department, instances: await attachRequestRelations(instances) }
}

export async function getPrivate(userId: string): Promise<WorkflowInstanceRecord[]> {
  const instances = await db
    .select()
    .from(workflowInstances)
    .where(
      and(
        isNull(workflowInstances.deletedAt),
        eq(workflowInstances.visibility, 'private'),
        or(eq(workflowInstances.createdBy, userId), eq(workflowInstances.assignedTo, userId)),
      ),
    )
    .orderBy(desc(workflowInstances.createdAt))

  return attachRequestRelations(instances)
}

export async function create(
  data: CreateTaskInput,
  createdBy: string,
): Promise<WorkflowInstanceRecord> {
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
  const resolvedOwner = isPrivate
    ? { ownerUserId: data.privateRecipientId ?? null, ownerDepartment: null }
    : await resolveOwner(data.ownerUserId, data.ownerDepartment)

  const assignedTo = isPrivate
    ? data.privateRecipientId ?? createdBy
    : resolvedOwner.ownerUserId ?? null

  const [created] = await db
    .insert(workflowInstances)
    .values({
      workflowId: workflow.id,
      title: data.title.trim(),
      description: data.description ?? null,
      currentStateId: initialState.id,
      createdBy,
      assignedTo,
      ownerDepartment: resolvedOwner.ownerDepartment,
      ownerUserId: resolvedOwner.ownerUserId,
      visibility: data.visibility ?? 'public',
      priority: data.priority ?? 'medium',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      metadata: data.metadata ?? {},
    })
    .returning()

  const watchingDepartments = isPrivate
    ? []
    : [...new Set((data.watchingDepartments ?? []).filter((department) => department !== resolvedOwner.ownerDepartment))]

  if (watchingDepartments.length > 0) {
    await replaceWatchingDepartments(created.id, watchingDepartments, createdBy)
  }

  await db.insert(workflowEvents).values({
    instanceId: created.id,
    eventType: 'created',
    toStateId: initialState.id,
    performedBy: createdBy,
    metadata: {
      source: 'api',
      workflowId: workflow.id,
      ownerDepartment: resolvedOwner.ownerDepartment,
      ownerUserId: resolvedOwner.ownerUserId,
      watchingDepartments,
    },
  })

  if (assignedTo) {
    await db.insert(instanceAssignments).values({
      instanceId: created.id,
      userId: assignedTo,
      assignedBy: createdBy,
    })
  }

  await notificationsService.create({
    userId: createdBy,
    type: 'task_assigned',
    title: 'Request submitted',
    message: `Your request "${created.title}" has been submitted successfully.`,
    entityType: 'workflow_instance',
    entityId: created.id,
  })

  if (assignedTo && assignedTo !== createdBy) {
    await notificationsService.create({
      userId: assignedTo,
      type: 'task_assigned',
      title: 'Request assigned to you',
      message: `"${created.title}" now needs your attention.`,
      entityType: 'workflow_instance',
      entityId: created.id,
    })
  }

  const [record] = await attachRequestRelations([created])
  return record
}

export async function getById(id: string): Promise<WorkflowInstanceRecord | null> {
  const [instance] = await db
    .select()
    .from(workflowInstances)
    .where(and(eq(workflowInstances.id, id), isNull(workflowInstances.deletedAt)))
    .limit(1)

  if (!instance) return null

  const [record] = await attachRequestRelations([instance])
  return record ?? null
}

export async function update(
  id: string,
  data: UpdateTaskInput,
  actorUserId?: string,
): Promise<WorkflowInstanceRecord | null> {
  const resolvedOwner = await resolveOwner(data.ownerUserId, data.ownerDepartment)

  const updateData: Partial<
    Pick<
      WorkflowInstance,
      'title' | 'description' | 'priority' | 'assignedTo' | 'metadata' | 'dueDate' | 'ownerDepartment' | 'ownerUserId' | 'updatedAt'
    >
  > = {
    updatedAt: new Date(),
  }

  if (typeof data.title === 'string') updateData.title = data.title.trim()
  if (typeof data.description !== 'undefined') updateData.description = data.description
  if (typeof data.priority !== 'undefined') updateData.priority = data.priority
  if (typeof data.assignedTo !== 'undefined') updateData.assignedTo = data.assignedTo
  if (typeof data.metadata !== 'undefined') updateData.metadata = data.metadata
  if (typeof data.dueDate !== 'undefined') updateData.dueDate = data.dueDate
  if (typeof data.ownerDepartment !== 'undefined') updateData.ownerDepartment = resolvedOwner.ownerDepartment
  if (typeof data.ownerUserId !== 'undefined') {
    updateData.ownerUserId = resolvedOwner.ownerUserId
    if (typeof data.assignedTo === 'undefined') {
      updateData.assignedTo = resolvedOwner.ownerUserId
    }
  }

  const [updated] = await db
    .update(workflowInstances)
    .set(updateData)
    .where(and(eq(workflowInstances.id, id), isNull(workflowInstances.deletedAt)))
    .returning()

  if (!updated) return null

  if (typeof data.watchingDepartments !== 'undefined') {
    await replaceWatchingDepartments(updated.id, data.watchingDepartments, actorUserId ?? updated.createdBy)
  }

  const [record] = await attachRequestRelations([updated])
  return record ?? null
}

export async function remove(id: string): Promise<void> {
  await db
    .update(workflowInstances)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(workflowInstances.id, id), isNull(workflowInstances.deletedAt)))
}

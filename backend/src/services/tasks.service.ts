import { alias } from 'drizzle-orm/pg-core'
import { and, asc, desc, eq, inArray, isNull, or } from 'drizzle-orm'
import { db } from '../db'
import {
  departmentDefaultAssignees,
  instanceAssignments,
  requestParticipants,
  roles,
  userRoles,
  users,
  workflowEvents,
  workflowInstances,
  workflows,
  workflowStates,
} from '../db/schema'
import type { WorkflowInstance } from '../db/schema'
import * as notificationsService from './notifications.service'
import * as departmentDefaultsService from './departmentDefaults.service'

type AppError = Error & { statusCode?: number }

interface RequestUser {
  id: string
  name: string
  email: string
  department: string | null
}

export interface WorkflowInstanceRecord extends WorkflowInstance {
  ownerUser?: RequestUser | null
  submittedByUser?: { id: string; name: string } | null
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
  const submitterIds = [...new Set(instances.map((instance) => instance.createdBy).filter(Boolean))] as string[]
  const allUserIds = [...new Set([...ownerUserIds, ...submitterIds])]

  const [allUsers, participants] = await Promise.all([
    allUserIds.length > 0
      ? db
          .select({ id: users.id, name: users.name, email: users.email, department: users.department })
          .from(users)
          .where(inArray(users.id, allUserIds))
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

  const userById = new Map(allUsers.map((user) => [user.id, user]))
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
    ownerUser: instance.ownerUserId ? (userById.get(instance.ownerUserId) ?? null) : null,
    submittedByUser: instance.createdBy ? (userById.get(instance.createdBy) ?? null) : null,
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

async function resolveDefaultOwner(department: string | null | undefined): Promise<string | null> {
  if (!department) return null
  const defaults = await departmentDefaultsService.getDefaultsForDepartments([department])
  return defaults.get(department) ?? null
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
  const userRoleRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(userRoles.userId, userId))

  const isPrivileged = userRoleRows.some((r) => r.roleName === 'Admin' || r.roleName === 'Manager')

  const instances = await db
    .select()
    .from(workflowInstances)
    .where(
      isPrivileged
        ? and(isNull(workflowInstances.deletedAt), eq(workflowInstances.visibility, 'public'))
        : and(
            isNull(workflowInstances.deletedAt),
            or(eq(workflowInstances.createdBy, userId), eq(workflowInstances.assignedTo, userId)),
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
  const explicitOwner = isPrivate
    ? data.privateRecipientId ?? null
    : data.ownerUserId ?? (await resolveDefaultOwner(data.ownerDepartment))
  const resolvedOwner = isPrivate
    ? { ownerUserId: explicitOwner, ownerDepartment: null }
    : await resolveOwner(explicitOwner, data.ownerDepartment)

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

  const current = await getById(id)
  if (!current) return null

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

  if (typeof data.ownerUserId !== 'undefined' && data.ownerUserId !== current.ownerUserId) {
    await db.insert(workflowEvents).values({
      instanceId: updated.id,
      eventType: 'owner_reassigned',
      performedBy: actorUserId ?? current.createdBy,
      metadata: {
        previousOwnerUserId: current.ownerUserId,
        nextOwnerUserId: updated.ownerUserId,
      },
    })

    if (updated.ownerUserId) {
      await db.insert(instanceAssignments).values({
        instanceId: updated.id,
        userId: updated.ownerUserId,
        assignedBy: actorUserId ?? current.createdBy,
      })

      await notificationsService.create({
        userId: updated.ownerUserId,
        type: 'task_assigned',
        title: 'Request reassigned to you',
        message: `"${updated.title}" now needs your attention.`,
        entityType: 'workflow_instance',
        entityId: updated.id,
      })
    }
  }

  if (typeof data.watchingDepartments !== 'undefined') {
    await replaceWatchingDepartments(updated.id, data.watchingDepartments, actorUserId ?? updated.createdBy)
  }

  const [record] = await attachRequestRelations([updated])
  return record ?? null
}

export interface RequestEvent {
  id: string
  eventType: string
  comment: string | null
  metadata: unknown
  createdAt: string
  performedBy: { id: string; name: string }
  fromStateName: string | null
  toStateName: string | null
  fromUserName: string | null
  toUserName: string | null
}

export async function getEvents(instanceId: string): Promise<RequestEvent[]> {
  const fromState = alias(workflowStates, 'from_state')
  const toState = alias(workflowStates, 'to_state')
  const performer = alias(users, 'performer')

  const rows = await db
    .select({
      id: workflowEvents.id,
      eventType: workflowEvents.eventType,
      comment: workflowEvents.comment,
      metadata: workflowEvents.metadata,
      createdAt: workflowEvents.createdAt,
      performedById: performer.id,
      performedByName: performer.name,
      fromStateName: fromState.label,
      toStateName: toState.label,
    })
    .from(workflowEvents)
    .innerJoin(performer, eq(performer.id, workflowEvents.performedBy))
    .leftJoin(fromState, eq(fromState.id, workflowEvents.fromStateId))
    .leftJoin(toState, eq(toState.id, workflowEvents.toStateId))
    .where(eq(workflowEvents.instanceId, instanceId))
    .orderBy(asc(workflowEvents.createdAt))

  // Resolve user IDs from owner_reassigned metadata
  const ownerUserIds = new Set<string>()
  for (const row of rows) {
    if (row.eventType === 'owner_reassigned' && row.metadata && typeof row.metadata === 'object') {
      const meta = row.metadata as Record<string, unknown>
      if (typeof meta.previousOwnerUserId === 'string') ownerUserIds.add(meta.previousOwnerUserId)
      if (typeof meta.nextOwnerUserId === 'string') ownerUserIds.add(meta.nextOwnerUserId)
    }
  }

  const ownerUserMap = new Map<string, string>()
  if (ownerUserIds.size > 0) {
    const resolved = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(inArray(users.id, [...ownerUserIds]))
    for (const u of resolved) ownerUserMap.set(u.id, u.name)
  }

  return rows.map((row) => {
    let fromUserName: string | null = null
    let toUserName: string | null = null
    if (row.eventType === 'owner_reassigned' && row.metadata && typeof row.metadata === 'object') {
      const meta = row.metadata as Record<string, unknown>
      fromUserName = typeof meta.previousOwnerUserId === 'string'
        ? (ownerUserMap.get(meta.previousOwnerUserId) ?? 'Unassigned')
        : 'Unassigned'
      toUserName = typeof meta.nextOwnerUserId === 'string'
        ? (ownerUserMap.get(meta.nextOwnerUserId) ?? 'Unassigned')
        : 'Unassigned'
    }
    return {
      id: row.id,
      eventType: row.eventType,
      comment: row.comment,
      metadata: row.metadata,
      createdAt: row.createdAt.toISOString(),
      performedBy: { id: row.performedById, name: row.performedByName },
      fromStateName: row.fromStateName ?? null,
      toStateName: row.toStateName ?? null,
      fromUserName,
      toUserName,
    }
  })
}

export async function addComment(instanceId: string, comment: string, userId: string): Promise<void> {
  await db.insert(workflowEvents).values({
    instanceId,
    eventType: 'commented',
    comment,
    performedBy: userId,
  })
}

export async function remove(id: string): Promise<void> {
  await db
    .update(workflowInstances)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(workflowInstances.id, id), isNull(workflowInstances.deletedAt)))
}

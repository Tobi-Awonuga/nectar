import { and, asc, desc, eq, isNull } from 'drizzle-orm'
import { db } from '../db'
import { roles, userRoles, users } from '../db/schema'
import type { Role, User } from '../db/schema'

export interface UserDirectoryEntry {
  id: string
  name: string
  email: string
  department: string | null
}

export async function getAll(_query: Record<string, unknown>): Promise<User[]> {
  return db
    .select()
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(asc(users.createdAt))
}

export async function getDirectory(query: Record<string, unknown>): Promise<UserDirectoryEntry[]> {
  const department = typeof query.department === 'string' && query.department.trim() ? query.department.trim() : null
  const whereClause = department
    ? and(isNull(users.deletedAt), eq(users.isActive, true), eq(users.department, department))
    : and(isNull(users.deletedAt), eq(users.isActive, true))

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      department: users.department,
    })
    .from(users)
    .where(whereClause)
    .orderBy(asc(users.name))
}

export async function getById(id: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1)

  return user ?? null
}

export async function update(id: string, data: Partial<Pick<User, 'name' | 'email' | 'isActive' | 'avatarUrl' | 'department'>>): Promise<User | null> {
  const updateData: Partial<Pick<User, 'name' | 'email' | 'isActive' | 'avatarUrl' | 'department' | 'updatedAt'>> = {
    updatedAt: new Date(),
  }

  if (typeof data.name === 'string') updateData.name = data.name.trim()
  if (typeof data.email === 'string') updateData.email = data.email.trim().toLowerCase()
  if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive
  if (typeof data.avatarUrl !== 'undefined') updateData.avatarUrl = data.avatarUrl
  if (typeof data.department === 'string') updateData.department = data.department
  if (data.department === null) updateData.department = null

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .returning()

  return updated ?? null
}

export async function remove(id: string): Promise<void> {
  await db
    .update(users)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
}

export async function getUserRoles(userId: string): Promise<Role[]> {
  const rows = await db
    .select({ role: roles })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(userRoles.userId, userId))

  return rows.map((r) => r.role)
}

export async function getAllRoles(): Promise<Role[]> {
  return db.select().from(roles).orderBy(asc(roles.name))
}

export async function assignRole(userId: string, roleId: string): Promise<void> {
  await db
    .insert(userRoles)
    .values({ userId, roleId })
    .onConflictDoNothing()
}

export async function removeRole(userId: string, roleId: string): Promise<void> {
  await db
    .delete(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
}

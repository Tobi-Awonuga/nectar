import { and, asc, desc, eq, isNull } from 'drizzle-orm'
import { db } from '../db'
import { roles, userRoles, users } from '../db/schema'
import type { Role, User } from '../db/schema'

export async function getAll(_query: Record<string, unknown>): Promise<User[]> {
  return db
    .select()
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(asc(users.createdAt))
}

export async function getById(id: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1)

  return user ?? null
}

export async function update(id: string, data: Partial<Pick<User, 'name' | 'email' | 'isActive' | 'avatarUrl'>>): Promise<User | null> {
  const updateData: Partial<Pick<User, 'name' | 'email' | 'isActive' | 'avatarUrl' | 'updatedAt'>> = {
    updatedAt: new Date(),
  }

  if (typeof data.name === 'string') updateData.name = data.name.trim()
  if (typeof data.email === 'string') updateData.email = data.email.trim().toLowerCase()
  if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive
  if (typeof data.avatarUrl !== 'undefined') updateData.avatarUrl = data.avatarUrl

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

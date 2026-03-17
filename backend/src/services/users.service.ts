import { and, asc, eq, isNull } from 'drizzle-orm'
import { db } from '../db'
import { users } from '../db/schema'
import type { User } from '../db/schema'

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

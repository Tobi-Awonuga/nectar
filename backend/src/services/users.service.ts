import { db } from '../db'
import { users } from '../db/schema'
import type { User } from '../db/schema'

export async function getAll(_query: Record<string, unknown>): Promise<User[]> {
  // TODO: parse pagination from query, return db.select().from(users).where(isNull(users.deletedAt))
  void db
  void users
  return []
}

export async function getById(id: string): Promise<User | null> {
  // TODO: return db.select().from(users).where(and(eq(users.id, id), isNull(users.deletedAt))).limit(1)
  void id
  return null
}

export async function update(id: string, data: Partial<User>): Promise<User | null> {
  // TODO: return db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id)).returning()
  void id
  void data
  return null
}

export async function remove(id: string): Promise<void> {
  // TODO: db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, id))
  void id
}

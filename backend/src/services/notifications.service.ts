import { and, desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { notifications } from '../db/schema'
import type { Notification, NewNotification } from '../db/schema'

export async function getForUser(
  userId: string,
  _query: Record<string, unknown>,
): Promise<Notification[]> {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50)
}

export async function markRead(
  notificationId: string,
  userId: string,
): Promise<Notification | null> {
  const [updated] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId),
      ),
    )
    .returning()

  return updated ?? null
}

export async function markAllRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId))
}

export async function create(data: NewNotification): Promise<Notification> {
  const [created] = await db
    .insert(notifications)
    .values(data)
    .returning()

  return created
}

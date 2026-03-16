import { db } from '../db'
import { notifications } from '../db/schema'
import type { Notification, NewNotification } from '../db/schema'

export async function getForUser(
  userId: string,
  _query: Record<string, unknown>,
): Promise<Notification[]> {
  // TODO: return db.select().from(notifications).where(eq(notifications.userId, userId))
  // with pagination and optional isRead filter from query
  void db
  void notifications
  void userId
  return []
}

export async function markRead(
  notificationId: string,
  userId: string,
): Promise<Notification | null> {
  // TODO: db.update(notifications).set({ isRead: true })
  //   .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
  //   .returning()
  void notificationId
  void userId
  return null
}

export async function markAllRead(userId: string): Promise<void> {
  // TODO: db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId))
  void userId
}

export async function create(data: NewNotification): Promise<Notification> {
  // TODO: db.insert(notifications).values(data).returning()
  void data
  throw new Error('Not implemented')
}

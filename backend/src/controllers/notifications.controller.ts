import type { Request, Response, NextFunction } from 'express'
import * as notificationsService from '../services/notifications.service'

export async function getNotifications(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // TODO: call notificationsService.getForUser with req.user.id and pagination params
    const result = await notificationsService.getForUser(
      req.user?.id ?? '',
      req.query as Record<string, unknown>,
    )
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function markNotificationRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // TODO: call notificationsService.markRead with notificationId and req.user.id
    const result = await notificationsService.markRead(req.params.id, req.user?.id ?? '')
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function markAllNotificationsRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // TODO: call notificationsService.markAllRead with req.user.id
    await notificationsService.markAllRead(req.user?.id ?? '')
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

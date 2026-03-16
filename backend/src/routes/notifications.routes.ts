import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notifications.controller'

const router = Router()

// All notification routes require authentication
router.use(authenticate)

// GET /api/notifications — list notifications for the current user
router.get('/', getNotifications)

// PATCH /api/notifications/:id/read — mark a single notification as read
router.patch('/:id/read', markNotificationRead)

// PATCH /api/notifications/read-all — mark all notifications as read for current user
router.patch('/read-all', markAllNotificationsRead)

export default router

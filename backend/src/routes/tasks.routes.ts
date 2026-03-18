import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requirePermission } from '../middleware/rbac.middleware'
import {
  getTasks,
  getPrivateTasks,
  createTask,
  getTaskById,
  getTaskEvents,
  updateTask,
  deleteTask,
  addComment,
  transitionState,
} from '../controllers/tasks.controller'

const router = Router()

// All task routes require authentication
router.use(authenticate)

// GET /api/tasks — list public workflow instances
router.get('/', requirePermission('task:read'), getTasks)

// GET /api/tasks/private — list private requests (only sender/recipient)
router.get('/private', requirePermission('task:read'), getPrivateTasks)

// POST /api/tasks — create a new workflow instance
router.post('/', requirePermission('task:update'), createTask)

// GET /api/tasks/:id — get a task by ID
router.get('/:id', requirePermission('task:read'), getTaskById)

// GET /api/tasks/:id/events — full audit trail for a request
router.get('/:id/events', requirePermission('task:read'), getTaskEvents)

// PATCH /api/tasks/:id — update task metadata
router.patch('/:id', requirePermission('task:update'), updateTask)

// DELETE /api/tasks/:id — soft-delete a task
router.delete('/:id', requirePermission('task:update'), deleteTask)

// POST /api/tasks/:id/comment — add a standalone note without changing state
router.post('/:id/comment', requirePermission('task:update'), addComment)

// POST /api/tasks/:id/transition — fire a state transition (core workflow engine endpoint)
router.post('/:id/transition', requirePermission('task:update'), transitionState)

export default router

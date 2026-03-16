import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requirePermission } from '../middleware/rbac.middleware'
import {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  transitionState,
} from '../controllers/tasks.controller'

const router = Router()

// All task routes require authentication
router.use(authenticate)

// GET /api/tasks — list workflow instances (tasks)
router.get('/', requirePermission('tasks:read'), getTasks)

// POST /api/tasks — create a new workflow instance
router.post('/', requirePermission('tasks:create'), createTask)

// GET /api/tasks/:id — get a task by ID
router.get('/:id', requirePermission('tasks:read'), getTaskById)

// PATCH /api/tasks/:id — update task metadata
router.patch('/:id', requirePermission('tasks:write'), updateTask)

// DELETE /api/tasks/:id — soft-delete a task
router.delete('/:id', requirePermission('tasks:delete'), deleteTask)

// POST /api/tasks/:id/transition — fire a state transition (core workflow engine endpoint)
router.post('/:id/transition', requirePermission('tasks:transition'), transitionState)

export default router

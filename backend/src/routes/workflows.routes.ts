import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requirePermission } from '../middleware/rbac.middleware'
import {
  getWorkflows,
  createWorkflow,
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow,
  getWorkflowStates,
  getWorkflowTransitions,
} from '../controllers/workflows.controller'

const router = Router()

// All workflow routes require authentication
router.use(authenticate)

// GET /api/workflows — list all active workflows
router.get('/', requirePermission('workflows:read'), getWorkflows)

// POST /api/workflows — create a new workflow definition
router.post('/', requirePermission('workflows:create'), createWorkflow)

// GET /api/workflows/:id — get a workflow by ID
router.get('/:id', requirePermission('workflows:read'), getWorkflowById)

// PATCH /api/workflows/:id — update a workflow definition
router.patch('/:id', requirePermission('workflows:write'), updateWorkflow)

// DELETE /api/workflows/:id — soft-delete a workflow
router.delete('/:id', requirePermission('workflows:delete'), deleteWorkflow)

// GET /api/workflows/:id/states — list states for a workflow
router.get('/:id/states', requirePermission('workflows:read'), getWorkflowStates)

// GET /api/workflows/:id/transitions — list transitions for a workflow
router.get('/:id/transitions', requirePermission('workflows:read'), getWorkflowTransitions)

export default router

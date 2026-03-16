import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requirePermission } from '../middleware/rbac.middleware'
import {
  getPendingApprovals,
  approveItem,
  rejectItem,
} from '../controllers/approvals.controller'

const router = Router()

// All approval routes require authentication
router.use(authenticate)

// GET /api/approvals/pending — list all instances awaiting the current user's approval
router.get('/pending', requirePermission('approvals:read'), getPendingApprovals)

// POST /api/approvals/:id/approve — approve a workflow instance
router.post('/:id/approve', requirePermission('approvals:action'), approveItem)

// POST /api/approvals/:id/reject — reject a workflow instance
router.post('/:id/reject', requirePermission('approvals:action'), rejectItem)

export default router

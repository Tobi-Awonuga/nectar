import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requirePermission } from '../middleware/rbac.middleware'
import {
  submitOnboarding,
  getPendingOnboarding,
  approveOnboarding,
  rejectOnboarding,
} from '../controllers/onboarding.controller'

const router = Router()

router.use(authenticate)

// POST /api/onboarding — new user submits their department + name (no permission required, just auth)
router.post('/', submitOnboarding)

// GET /api/onboarding/pending — admin: list users pending approval
router.get('/pending', requirePermission('users:read'), getPendingOnboarding)

// POST /api/onboarding/:userId/approve — admin: approve a user
router.post('/:userId/approve', requirePermission('users:write'), approveOnboarding)

// POST /api/onboarding/:userId/reject — admin: reject a user
router.post('/:userId/reject', requirePermission('users:write'), rejectOnboarding)

export default router

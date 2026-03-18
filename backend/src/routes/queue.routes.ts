import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requirePermission } from '../middleware/rbac.middleware'
import { getDepartmentQueue } from '../controllers/queue.controller'

const router = Router()

router.use(authenticate)

// GET /api/queue — returns all public requests owned by the caller's department
router.get('/', requirePermission('task:read'), getDepartmentQueue)

export default router

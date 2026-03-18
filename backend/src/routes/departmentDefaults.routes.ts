import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requirePermission } from '../middleware/rbac.middleware'
import {
  getDepartmentDefaults,
  upsertDepartmentDefault,
} from '../controllers/departmentDefaults.controller'

const router = Router()

router.use(authenticate)

router.get('/', requirePermission('users:read'), getDepartmentDefaults)
router.put('/', requirePermission('users:write'), upsertDepartmentDefault)

export default router

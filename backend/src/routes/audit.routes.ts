import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requirePermission } from '../middleware/rbac.middleware'
import { getAuditEvents, getAuditEventsByInstance } from '../controllers/audit.controller'

const router = Router()

// All audit routes require authentication
router.use(authenticate)

// GET /api/audit — list audit events with optional query filters (userId, eventType, date range)
router.get('/', requirePermission('audit:read'), getAuditEvents)

// GET /api/audit/:instanceId — list all audit events for a specific workflow instance
router.get('/:instanceId', requirePermission('audit:read'), getAuditEventsByInstance)

export default router

import { Router } from 'express'
import authRoutes from './auth.routes'
import usersRoutes from './users.routes'
import workflowsRoutes from './workflows.routes'
import tasksRoutes from './tasks.routes'
import approvalsRoutes from './approvals.routes'
import notificationsRoutes from './notifications.routes'
import auditRoutes from './audit.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/users', usersRoutes)
router.use('/workflows', workflowsRoutes)
router.use('/tasks', tasksRoutes)
router.use('/approvals', approvalsRoutes)
router.use('/notifications', notificationsRoutes)
router.use('/audit', auditRoutes)

export default router

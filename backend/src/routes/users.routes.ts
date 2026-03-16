import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requirePermission } from '../middleware/rbac.middleware'
import { getUsers, getUserById, updateUser, deleteUser } from '../controllers/users.controller'

const router = Router()

// All user routes require authentication
router.use(authenticate)

// GET /api/users — list all users
router.get('/', requirePermission('users:read'), getUsers)

// GET /api/users/:id — get a single user
router.get('/:id', requirePermission('users:read'), getUserById)

// PATCH /api/users/:id — update a user
router.patch('/:id', requirePermission('users:write'), updateUser)

// DELETE /api/users/:id — soft-delete a user
router.delete('/:id', requirePermission('users:delete'), deleteUser)

export default router

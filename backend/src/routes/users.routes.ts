import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requirePermission } from '../middleware/rbac.middleware'
import {
  getUsers,
  getUserDirectory,
  getUserById,
  updateUser,
  deleteUser,
  getUserRoles,
  getAllRoles,
  assignRole,
  removeRole,
} from '../controllers/users.controller'

const router = Router()

// All user routes require authentication
router.use(authenticate)

// GET /api/users — list all users
router.get('/', requirePermission('users:read'), getUsers)

// GET /api/users/directory — lightweight user list for request routing
router.get('/directory', requirePermission('task:read'), getUserDirectory)

// GET /api/users/roles — list all available roles
router.get('/roles', requirePermission('users:read'), getAllRoles)

// GET /api/users/:id — get a single user
router.get('/:id', requirePermission('users:read'), getUserById)

// PATCH /api/users/:id — update a user
router.patch('/:id', requirePermission('users:write'), updateUser)

// DELETE /api/users/:id — soft-delete a user
router.delete('/:id', requirePermission('users:delete'), deleteUser)

// GET /api/users/:id/roles — get roles for a user
router.get('/:id/roles', requirePermission('users:read'), getUserRoles)

// POST /api/users/:id/roles — assign a role to a user
router.post('/:id/roles', requirePermission('users:write'), assignRole)

// DELETE /api/users/:id/roles/:roleId — remove a role from a user
router.delete('/:id/roles/:roleId', requirePermission('users:write'), removeRole)

export default router

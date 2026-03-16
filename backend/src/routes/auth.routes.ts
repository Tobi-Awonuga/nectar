import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { login, logout, getMe } from '../controllers/auth.controller'

const router = Router()

// POST /api/auth/login — exchange credentials/token for a session
router.post('/login', login)

// POST /api/auth/logout — invalidate session
router.post('/logout', authenticate, logout)

// GET /api/auth/me — return the current authenticated user
router.get('/me', authenticate, getMe)

export default router

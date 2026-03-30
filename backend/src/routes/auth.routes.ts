import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { login, logout, getMe, devLogin } from '../controllers/auth.controller'

const router = Router()

// POST /api/auth/dev-login — dev bypass (non-production only)
router.post('/dev-login', devLogin)

// POST /api/auth/login — exchange credentials/token for a session
router.post('/login', login)

// POST /api/auth/logout — invalidate session
router.post('/logout', authenticate, logout)

// GET /api/auth/me — return the current authenticated user
router.get('/me', authenticate, getMe)

export default router

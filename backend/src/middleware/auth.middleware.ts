import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

interface NectarTokenPayload {
  sub: string
  email: string
  name: string
}

// Validates a Nectar-issued JWT (not the Microsoft token directly)
// The Microsoft token is only used once at POST /api/auth/login
// All subsequent requests carry our own shorter-lived JWT
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: missing or invalid Authorization header' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as NectarTokenPayload
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    }
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized: invalid or expired token' })
  }
}

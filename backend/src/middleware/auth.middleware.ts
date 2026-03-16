import type { Request, Response, NextFunction } from 'express'

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  // TODO: extract Bearer token from Authorization header
  // TODO: verify JWT and decode payload
  // TODO: attach user to req.user
  // For now: stub that returns 401 if no Authorization header
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: missing or invalid Authorization header' })
    return
  }
  // TODO: implement full JWT verification once SSO feature is built
  next()
}

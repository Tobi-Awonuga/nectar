import type { Request, Response, NextFunction } from 'express'

export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // TODO: load user's permissions from DB via req.user.id
    // TODO: check if permission is in the set
    // For now: stub that calls next() (implementation comes with auth feature)
    void permission
    void req
    void res
    next()
  }
}

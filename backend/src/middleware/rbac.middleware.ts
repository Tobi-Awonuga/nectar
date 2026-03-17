import type { Request, Response, NextFunction } from 'express'
import { eq, inArray } from 'drizzle-orm'
import { db } from '../db'
import { userRoles, rolePermissions, permissions } from '../db/schema'

export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.id
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    try {
      const userRoleRows = await db
        .select({ roleId: userRoles.roleId })
        .from(userRoles)
        .where(eq(userRoles.userId, userId))

      if (userRoleRows.length === 0) {
        res.status(403).json({ error: 'Forbidden: no roles assigned' })
        return
      }

      const roleIds = userRoleRows.map((r) => r.roleId)

      const permRows = await db
        .select({ name: permissions.name })
        .from(rolePermissions)
        .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
        .where(inArray(rolePermissions.roleId, roleIds))

      const hasPermission = permRows.some((p) => p.name === permission)

      if (!hasPermission) {
        res.status(403).json({ error: `Forbidden: missing permission '${permission}'` })
        return
      }

      next()
    } catch (err) {
      next(err)
    }
  }
}

import type { Request, Response, NextFunction } from 'express'
import * as auditService from '../services/audit.service'

export async function getAuditEvents(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // and call auditService.getAll with those filters
    const result = await auditService.getAll(req.query as Record<string, unknown>)
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function getAuditEventsByInstance(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await auditService.getByInstance(req.params.instanceId)
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

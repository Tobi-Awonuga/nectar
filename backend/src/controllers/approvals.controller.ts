import type { Request, Response, NextFunction } from 'express'
import * as approvalsService from '../services/approvals.service'

export async function getPendingApprovals(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await approvalsService.getPending(req.user?.id ?? '')
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function approveItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await approvalsService.approve(
      req.params.id,
      req.user?.id ?? '',
      req.body as { comment?: string },
    )
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function rejectItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await approvalsService.reject(
      req.params.id,
      req.user?.id ?? '',
      req.body as { comment?: string },
    )
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

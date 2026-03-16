import type { Request, Response, NextFunction } from 'express'
import * as approvalsService from '../services/approvals.service'

export async function getPendingApprovals(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // TODO: call approvalsService.getPending with req.user.id to get instances awaiting approval
    const result = await approvalsService.getPending(req.user?.id ?? '')
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function approveItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // TODO: call approvalsService.approve with instanceId, userId, and optional comment
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
    // TODO: call approvalsService.reject with instanceId, userId, and optional comment
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

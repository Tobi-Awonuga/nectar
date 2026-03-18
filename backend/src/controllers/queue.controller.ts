import type { Request, Response, NextFunction } from 'express'
import * as tasksService from '../services/tasks.service'

export async function getDepartmentQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await tasksService.getDepartmentQueue(req.user?.id ?? '')
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

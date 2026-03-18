import type { NextFunction, Request, Response } from 'express'
import * as departmentDefaultsService from '../services/departmentDefaults.service'

export async function getDepartmentDefaults(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await departmentDefaultsService.getAll()
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function upsertDepartmentDefault(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { department, userId } = req.body as { department?: string; userId?: string }

    if (!department || !userId) {
      res.status(400).json({ error: 'department and userId are required' })
      return
    }

    const result = await departmentDefaultsService.upsert(department, userId, req.user?.id ?? '')
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

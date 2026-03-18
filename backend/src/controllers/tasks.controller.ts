import type { Request, Response, NextFunction } from 'express'
import * as tasksService from '../services/tasks.service'
import * as workflowsService from '../services/workflows.service'

export async function getPrivateTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await tasksService.getPrivate(req.user?.id ?? '')
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // TODO: parse pagination/filter params, call tasksService.getAll
    const result = await tasksService.getAll(req.user?.id ?? '', req.query as Record<string, unknown>)
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // TODO: call tasksService.create with req.body and req.user.id as createdBy
    const result = await tasksService.create(req.body, req.user?.id ?? '')
    res.status(201).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function getTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // TODO: call tasksService.getById, return 404 if not found
    const result = await tasksService.getById(req.params.id)
    if (!result) {
      res.status(404).json({ error: 'Task not found' })
      return
    }
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await tasksService.update(req.params.id, req.body, req.user?.id)
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // TODO: call tasksService.remove to soft-delete
    await tasksService.remove(req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function getTaskEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await tasksService.getEvents(req.params.id)
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function transitionState(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { actionName, comment } = req.body as { actionName: string; comment?: string }
    const result = await workflowsService.transitionState(
      req.params.id,
      actionName,
      req.user?.id ?? '',
      comment,
    )
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

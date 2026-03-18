import type { Request, Response, NextFunction } from 'express'
import * as workflowsService from '../services/workflows.service'

export async function getWorkflows(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await workflowsService.getAll(req.query as Record<string, unknown>)
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function createWorkflow(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await workflowsService.create(req.body, req.user?.id ?? '')
    res.status(201).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function getWorkflowById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await workflowsService.getById(req.params.id)
    if (!result) {
      res.status(404).json({ error: 'Workflow not found' })
      return
    }
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function updateWorkflow(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await workflowsService.update(req.params.id, req.body)
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function deleteWorkflow(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await workflowsService.remove(req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function getWorkflowStates(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await workflowsService.getStates(req.params.id)
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function getWorkflowTransitions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await workflowsService.getTransitions(req.params.id)
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

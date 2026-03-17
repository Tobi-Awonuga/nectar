import type { Request, Response, NextFunction } from 'express'
import * as usersService from '../services/users.service'

export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // TODO: parse pagination params from req.query, call usersService.getAll
    const result = await usersService.getAll(req.query as Record<string, unknown>)
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // TODO: call usersService.getById, return 404 if not found
    const result = await usersService.getById(req.params.id)
    if (!result) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // TODO: call usersService.update with req.params.id and req.body
    const result = await usersService.update(req.params.id, req.body)
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // TODO: call usersService.remove to soft-delete, return 204
    await usersService.remove(req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function getUserRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await usersService.getUserRoles(req.params.id)
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function getAllRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await usersService.getAllRoles()
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function assignRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { roleId } = req.body as { roleId: string }
    if (!roleId) {
      res.status(400).json({ error: 'roleId is required' })
      return
    }
    await usersService.assignRole(req.params.id, roleId)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function removeRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await usersService.removeRole(req.params.id, req.params.roleId)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

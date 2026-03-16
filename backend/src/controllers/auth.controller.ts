import type { Request, Response, NextFunction } from 'express'
import * as authService from '../services/auth.service'

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // TODO: extract credentials from req.body, call authService.login, return JWT token
    const result = await authService.login(req.body)
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // TODO: invalidate session/token via authService.logout
    await authService.logout(req.user?.id ?? '')
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // TODO: return the current authenticated user from authService.getMe
    const result = await authService.getMe(req.user?.id ?? '')
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

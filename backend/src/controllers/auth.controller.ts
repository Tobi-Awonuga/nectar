import type { Request, Response, NextFunction } from 'express'
import * as authService from '../services/auth.service'

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { idToken } = req.body as { idToken?: string }

    if (!idToken) {
      res.status(400).json({ error: 'idToken is required' })
      return
    }

    const result = await authService.login(idToken)
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // JWT is stateless — client discards the token on its end
    res.json({ data: { message: 'Logged out' } })
  } catch (err) {
    next(err)
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getMe(req.user!.id)
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json({ data: user })
  } catch (err) {
    next(err)
  }
}

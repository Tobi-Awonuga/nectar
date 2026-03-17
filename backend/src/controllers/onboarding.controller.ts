import type { Request, Response, NextFunction } from 'express'
import * as onboardingService from '../services/onboarding.service'

export async function submitOnboarding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return }
    const { firstName, lastName, department } = req.body as {
      firstName: string
      lastName: string
      department: string
    }
    if (!firstName?.trim() || !lastName?.trim() || !department?.trim()) {
      res.status(400).json({ error: 'firstName, lastName, and department are required' })
      return
    }
    await onboardingService.submitOnboarding(userId, { firstName, lastName, department })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function getPendingOnboarding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await onboardingService.getPendingUsers()
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function approveOnboarding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reviewerId = req.user?.id
    if (!reviewerId) { res.status(401).json({ error: 'Unauthorized' }); return }
    await onboardingService.approveUser(req.params.userId, reviewerId)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function rejectOnboarding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reviewerId = req.user?.id
    if (!reviewerId) { res.status(401).json({ error: 'Unauthorized' }); return }
    const { notes } = req.body as { notes?: string }
    await onboardingService.rejectUser(req.params.userId, reviewerId, notes)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

import type { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger'

export interface AppError extends Error {
  statusCode?: number
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // TODO: log error, return JSON { error: message } with appropriate status code
  // Default to 500 if no statusCode on error
  const statusCode = err.statusCode ?? 500
  logger.error(err.message, { statusCode, stack: err.stack, path: req.url, method: req.method })
  res.status(statusCode).json({ error: err.message ?? 'Internal Server Error' })
}

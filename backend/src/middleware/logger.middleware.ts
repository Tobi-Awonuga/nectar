import type { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger'

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // TODO: log method, url, then on res finish log status and duration
  const start = Date.now()
  logger.info(`--> ${req.method} ${req.url}`)

  res.on('finish', () => {
    const duration = Date.now() - start
    logger.info(`<-- ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`)
  })

  next()
}

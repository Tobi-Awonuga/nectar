import type { Request, Response, NextFunction } from 'express'
import type { ZodSchema } from 'zod'

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // TODO: parse req.body with schema
    // On error return 400 with validation errors
    // On success attach parsed data to req.body and call next()
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({ error: 'Validation failed', details: result.error.errors })
      return
    }
    req.body = result.data
    next()
  }
}

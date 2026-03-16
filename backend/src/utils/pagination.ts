import type { PaginationParams, PaginatedResponse } from '../types/domain.types'

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  // TODO: parse page and limit from query string with defaults (page=1, limit=20, max limit=100)
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1)
  const rawLimit = parseInt(String(query.limit ?? '20'), 10) || 20
  const limit = Math.min(Math.max(1, rawLimit), 100)
  return { page, limit }
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginatedResponse<T> {
  // TODO: build the response object
  const totalPages = Math.ceil(total / params.limit)
  return {
    data,
    total,
    page: params.page,
    limit: params.limit,
    totalPages,
  }
}

import { useState } from 'react'

export function usePagination(defaultLimit = 20) {
  const [page, setPage] = useState(1)
  const [limit] = useState(defaultLimit)

  function nextPage() { setPage((p) => p + 1) }
  function prevPage() { setPage((p) => Math.max(1, p - 1)) }
  function goToPage(p: number) { setPage(p) }

  return { page, limit, nextPage, prevPage, goToPage }
}

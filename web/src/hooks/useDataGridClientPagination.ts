import { useCallback, useMemo, useState } from 'react'
import type { POSKasirInternalCommonPaginationPagination } from '@/lib/api/generated'

export function useDataGridClientPagination(totalItems: number, defaultPageSize = 10) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1)
  const safePage = Math.min(page, totalPages)

  const pagination: POSKasirInternalCommonPaginationPagination = useMemo(
    () => ({
      current_page: safePage,
      per_page: pageSize,
      total_page: totalPages,
      total_data: totalItems,
    }),
    [safePage, pageSize, totalPages, totalItems],
  )

  const sliceRange = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return { start, end: start + pageSize }
  }, [safePage, pageSize])

  return {
    page: safePage,
    setPage: (p: number) => setPage(Math.max(1, p)),
    pageSize,
    setPageSize: (size: number) => {
      setPageSize(size)
      setPage(1)
    },
    pagination,
    sliceRange,
    resetPage: useCallback(() => setPage(1), []),
  }
}

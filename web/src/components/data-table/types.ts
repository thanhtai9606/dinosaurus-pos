import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { SortDirection } from '@/components/data-table/TableColumnHeader'
import type { POSKasirInternalCommonPaginationPagination } from '@/lib/api/generated'

export type DataGridColumnDef<T> = {
  id: string
  header: string
  icon?: LucideIcon
  /** Client sort value or server sort field name */
  accessor?: (row: T) => string | number
  sortKey?: string
  sortable?: boolean
  align?: 'left' | 'right'
  defaultVisible?: boolean
  /** Column cannot be hidden */
  locked?: boolean
  className?: string
  cell: (row: T) => ReactNode
}

export type DataGridServerState = {
  pagination?: POSKasirInternalCommonPaginationPagination
  onPageChange?: (page: number) => void
  onLimitChange?: (limit: number) => void
  isFetching?: boolean
  /** Active server sort column id */
  sortBy?: string
  sortDir?: SortDirection
  onSortChange?: (columnId: string, direction: SortDirection) => void
}

export type DataGridProps<T> = {
  columns: DataGridColumnDef<T>[]
  data: T[]
  getRowId: (row: T) => string
  emptyMessage?: ReactNode
  storageKey?: string
  server?: DataGridServerState
  /** Client-side sort when server.onSortChange is not set */
  enableClientSort?: boolean
  className?: string
  toolbarExtra?: ReactNode
}

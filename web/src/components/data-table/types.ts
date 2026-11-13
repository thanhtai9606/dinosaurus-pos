import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { SortDirection } from '@/components/data-table/TableColumnHeader'
import type { POSKasirInternalCommonPaginationPagination } from '@/lib/api/generated'

export type DataGridColumnFilterOption = { value: string; label: string }

export type DataGridColumnDef<T> = {
  id: string
  header: string
  icon?: LucideIcon
  /** Client sort value or server sort field name */
  accessor?: (row: T) => string | number
  /** Used for filter match; defaults to accessor stringified */
  filterAccessor?: (row: T) => string
  sortKey?: string
  sortable?: boolean
  /** Quick filter input under column header */
  filterable?: boolean
  filterType?: 'text' | 'select'
  filterOptions?: DataGridColumnFilterOption[]
  filterPlaceholder?: string
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
  /** Server-driven column filters (columnId → value) */
  columnFilters?: Record<string, string>
  onColumnFiltersChange?: (filters: Record<string, string>) => void
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
  /** When no server.pagination, slice rows locally (default true) */
  enableClientPagination?: boolean
  defaultPageSize?: number
  className?: string
  toolbarExtra?: ReactNode
}

import { useEffect, useMemo, useState } from 'react'
import { Columns3, FilterX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ListPagination } from '@/components/pagination'
import { TableColumnHeader, type SortDirection } from '@/components/data-table/TableColumnHeader'
import { useClientSort } from '@/hooks/use-client-sort'
import { useDataGridColumnVisibility } from '@/hooks/useDataGridColumnVisibility'
import { useDataGridClientPagination } from '@/hooks/useDataGridClientPagination'
import { cn } from '@/lib/utils'
import { applyClientFilters } from '@/components/data-table/applyClientFilters'
import type { DataGridProps } from '@/components/data-table/types'

const EMPTY_COLUMN_FILTERS: Record<string, string> = {}

export function DataGrid<T>({
  columns,
  data,
  getRowId,
  emptyMessage,
  storageKey,
  server,
  enableClientSort = true,
  enableClientPagination = true,
  defaultPageSize = 10,
  className,
  toolbarExtra,
  onRowClick,
  rowSelection,
}: DataGridProps<T>) {
  const { t } = useTranslation()
  const useServerPagination = Boolean(server?.pagination && server.onPageChange)
  const useServerFilters = Boolean(server?.onColumnFiltersChange)

  const [clientFilters, setClientFilters] = useState<Record<string, string>>({})
  const columnFilters = useServerFilters ? (server?.columnFilters ?? EMPTY_COLUMN_FILTERS) : clientFilters

  const setColumnFilters = (next: Record<string, string>) => {
    if (useServerFilters && server?.onColumnFiltersChange) {
      server.onColumnFiltersChange(next)
    } else {
      setClientFilters(next)
    }
  }

  const defaultVisible = useMemo(
    () => Object.fromEntries(columns.map((c) => [c.id, c.defaultVisible !== false])),
    [columns],
  )

  const { visible, visibleIds, toggle } = useDataGridColumnVisibility(
    columns.map((c) => c.id),
    defaultVisible,
    storageKey,
  )

  const clientGetters = useMemo(() => {
    const g: Record<string, (row: T) => string | number> = {}
    for (const col of columns) {
      if (col.accessor) g[col.id] = col.accessor
    }
    return g
  }, [columns])

  const filteredData = useMemo(
    () => applyClientFilters(data, columns, columnFilters),
    [data, columns, columnFilters],
  )

  const clientSort = useClientSort(filteredData, clientGetters as Record<string, (row: T) => string | number>)
  const useServerSort = Boolean(server?.onSortChange)

  const sortedData = useMemo(() => {
    if (useServerSort || !enableClientSort || Object.keys(clientGetters).length === 0) {
      return filteredData
    }
    return clientSort.sorted
  }, [filteredData, clientSort.sorted, clientGetters, enableClientSort, useServerSort])

  const clientPage = useDataGridClientPagination(sortedData.length, defaultPageSize)

  const { resetPage } = clientPage
  useEffect(() => {
    if (useServerPagination) return
    resetPage()
  }, [columnFilters, resetPage, useServerPagination])

  const displayData = useMemo(() => {
    if (useServerPagination) return sortedData
    if (!enableClientPagination) return sortedData
    const { start, end } = clientPage.sliceRange
    return sortedData.slice(start, end)
  }, [sortedData, useServerPagination, enableClientPagination, clientPage.sliceRange])

  const getSortDirection = (colId: string): SortDirection => {
    if (useServerSort) {
      if (server?.sortBy !== colId) return false
      return server.sortDir || false
    }
    return clientSort.getSortDirection(colId as keyof typeof clientGetters)
  }

  const handleSort = (col: (typeof columns)[0]) => {
    if (!col.sortable) return
    if (useServerSort && server?.onSortChange) {
      const current = getSortDirection(col.id)
      let next: SortDirection = 'asc'
      if (current === 'asc') next = 'desc'
      else if (current === 'desc') next = false
      server.onSortChange(col.id, next)
      return
    }
    if (col.accessor && enableClientSort) {
      clientSort.toggleSort(col.id as keyof typeof clientGetters)
    }
  }

  const activeColumns = columns.filter((c) => visibleIds.includes(c.id))
  const hasFilters = columns.some((c) => c.filterable)
  const anyFilterActive = Object.values(columnFilters).some((v) => v.trim() !== '' && v !== '__all__')

  const updateFilter = (colId: string, value: string) => {
    setColumnFilters({ ...columnFilters, [colId]: value })
  }

  const clearFilters = () => setColumnFilters({})

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {toolbarExtra}
        {hasFilters && anyFilterActive && (
          <Button variant="ghost" size="sm" className="gap-2" onClick={clearFilters}>
            <FilterX className="h-4 w-4" />
            {t('data_grid.clear_filters')}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Columns3 className="h-4 w-4" />
              {t('data_grid.columns')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{t('data_grid.toggle_columns')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={visible[col.id] !== false}
                disabled={col.locked}
                onCheckedChange={(checked) => toggle(col.id, checked)}
              >
                {col.header}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {rowSelection && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={rowSelection.allSelected ? true : rowSelection.someSelected ? 'indeterminate' : false}
                    onCheckedChange={(v) => rowSelection.onSelectAll(v === true)}
                    aria-label={t('data_grid.select_all')}
                  />
                </TableHead>
              )}
              {activeColumns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(col.align === 'right' && 'text-right', col.className)}
                >
                  <TableColumnHeader
                    title={col.header}
                    icon={col.icon}
                    sort={col.sortable ? getSortDirection(col.id) : false}
                    onSort={col.sortable ? () => handleSort(col) : undefined}
                    align={col.align}
                  />
                </TableHead>
              ))}
            </TableRow>
            {hasFilters && (
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {rowSelection && <TableHead className="w-10" />}
                {activeColumns.map((col) => (
                  <TableHead key={`${col.id}-filter`} className="py-2">
                    {!col.filterable ? null : col.filterType === 'select' && col.filterOptions ? (
                      <Select
                        value={columnFilters[col.id] || '__all__'}
                        onValueChange={(v) => updateFilter(col.id, v === '__all__' ? '' : v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder={t('data_grid.filter_all')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">{t('data_grid.filter_all')}</SelectItem>
                          {col.filterOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        className="h-8 text-xs"
                        placeholder={col.filterPlaceholder ?? t('data_grid.filter_placeholder')}
                        value={columnFilters[col.id] ?? ''}
                        onChange={(e) => updateFilter(col.id, e.target.value)}
                      />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {displayData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={activeColumns.length + (rowSelection ? 1 : 0)}
                  className="h-32 text-center text-muted-foreground"
                >
                  {emptyMessage ?? t('data_grid.empty')}
                </TableCell>
              </TableRow>
            ) : (
              displayData.map((row) => (
                <TableRow
                  key={getRowId(row)}
                  className={cn(onRowClick && 'cursor-pointer hover:bg-muted/50')}
                  onClick={() => onRowClick?.(row)}
                >
                  {rowSelection && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={rowSelection.selectedIds.has(getRowId(row))}
                        onCheckedChange={(v) => rowSelection.onSelectRow(getRowId(row), v === true)}
                        aria-label={t('data_grid.select_row')}
                      />
                    </TableCell>
                  )}
                  {activeColumns.map((col) => (
                    <TableCell
                      key={col.id}
                      className={cn(col.align === 'right' && 'text-right', col.className)}
                      onClick={col.id === 'actions' ? (e) => e.stopPropagation() : undefined}
                    >
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {useServerPagination && server?.pagination && server.onPageChange ? (
        <ListPagination
          pagination={server.pagination}
          onPageChange={server.onPageChange}
          onLimitChange={server.onLimitChange}
          isFetching={server.isFetching}
        />
      ) : enableClientPagination && (sortedData.length > 0 || anyFilterActive) ? (
        <ListPagination
          pagination={clientPage.pagination}
          onPageChange={clientPage.setPage}
          onLimitChange={clientPage.setPageSize}
        />
      ) : null}
    </div>
  )
}

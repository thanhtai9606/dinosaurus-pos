import { useMemo } from 'react'
import { Columns3 } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import type { DataGridProps } from '@/components/data-table/types'

export function DataGrid<T>({
  columns,
  data,
  getRowId,
  emptyMessage,
  storageKey,
  server,
  enableClientSort = true,
  className,
  toolbarExtra,
}: DataGridProps<T>) {
  const { t } = useTranslation()

  const defaultVisible = useMemo(
    () =>
      Object.fromEntries(columns.map((c) => [c.id, c.defaultVisible !== false])),
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

  const clientSort = useClientSort(data, clientGetters as Record<string, (row: T) => string | number>)
  const useServerSort = Boolean(server?.onSortChange)

  const displayData = useMemo(() => {
    if (useServerSort || !enableClientSort || Object.keys(clientGetters).length === 0) {
      return data
    }
    return clientSort.sorted
  }, [data, clientSort.sorted, clientGetters, enableClientSort, useServerSort])

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

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {toolbarExtra}
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
          </TableHeader>
          <TableBody>
            {displayData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={activeColumns.length} className="h-32 text-center text-muted-foreground">
                  {emptyMessage ?? t('data_grid.empty')}
                </TableCell>
              </TableRow>
            ) : (
              displayData.map((row) => (
                <TableRow key={getRowId(row)}>
                  {activeColumns.map((col) => (
                    <TableCell
                      key={col.id}
                      className={cn(col.align === 'right' && 'text-right', col.className)}
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

      {server?.pagination && server.onPageChange ? (
        <ListPagination
          pagination={server.pagination}
          onPageChange={server.onPageChange}
          onLimitChange={server.onLimitChange}
          isFetching={server.isFetching}
        />
      ) : null}
    </div>
  )
}

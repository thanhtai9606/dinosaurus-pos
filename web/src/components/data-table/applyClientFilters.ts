import type { DataGridColumnDef } from '@/components/data-table/types'

export function applyClientFilters<T>(
  rows: T[],
  columns: DataGridColumnDef<T>[],
  filters: Record<string, string>,
): T[] {
  const active = Object.entries(filters).filter(([, v]) => v.trim() !== '' && v !== '__all__')
  if (active.length === 0) return rows

  return rows.filter((row) =>
    active.every(([colId, raw]) => {
      const col = columns.find((c) => c.id === colId)
      if (!col) return true
      const hay = (
        col.filterAccessor?.(row) ?? (col.accessor ? String(col.accessor(row)) : '')
      ).toLowerCase()
      const needle = raw.trim().toLowerCase()
      if (col.filterType === 'select') return hay === needle
      return hay.includes(needle)
    }),
  )
}

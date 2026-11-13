import { useMemo } from 'react'
import { Calendar, Settings2, Tags } from 'lucide-react'
import type { Category } from '@/lib/api/query/categories'
import { DataGrid, type DataGridColumnDef } from '@/components/data-table'

type Props = {
    categories: Category[]
    t: (key: string, fallback?: string) => string
    renderActions: (category: Category) => React.ReactNode
    onRowClick?: (category: Category) => void
    rowSelection?: {
        selectedIds: Set<string>
        onSelectRow: (id: string, selected: boolean) => void
        onSelectAll: (selected: boolean) => void
        allSelected: boolean
        someSelected: boolean
    }
}

export function ProductGroupsTable({ categories, t, renderActions, onRowClick, rowSelection }: Props) {
    const columns = useMemo<DataGridColumnDef<Category>[]>(
        () => [
            {
                id: 'name',
                header: t('settings.category.table.name'),
                icon: Tags,
                sortable: true,
                filterable: true,
                accessor: (c) => c.name ?? '',
                cell: (c) => <span className="font-medium">{c.name}</span>,
            },
            {
                id: 'created_at',
                header: t('settings.category.table.created_at'),
                icon: Calendar,
                sortable: true,
                accessor: (c) => (c.created_at ? new Date(c.created_at).getTime() : 0),
                cell: (c) => (
                    <span className="text-muted-foreground text-sm">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: t('settings.category.table.actions'),
                icon: Settings2,
                align: 'right',
                locked: true,
                cell: (c) => renderActions(c),
            },
        ],
        [t, renderActions],
    )

    return (
        <DataGrid
            storageKey="product-groups-list-grid"
            columns={columns}
            data={categories}
            getRowId={(c) => String(c.id)}
            emptyMessage={t('settings.category.table.empty')}
            onRowClick={onRowClick}
            rowSelection={rowSelection}
        />
    )
}

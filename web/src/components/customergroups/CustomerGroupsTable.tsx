import { useMemo } from 'react'
import { AlignLeft, Hash, Settings2, Tags } from 'lucide-react'
import type { CustomerGroup } from '@/lib/api/query/customerGroups'
import { DataGrid, type DataGridColumnDef } from '@/components/data-table'
import type { POSKasirInternalCommonPaginationPagination } from '@/lib/api/generated'

type ServerState = {
    pagination?: POSKasirInternalCommonPaginationPagination
    onPageChange?: (page: number) => void
    onLimitChange?: (limit: number) => void
    isFetching?: boolean
}

type Props = {
    groups: CustomerGroup[]
    t: (key: string, fallback?: string) => string
    renderActions: (group: CustomerGroup) => React.ReactNode
    onRowClick?: (group: CustomerGroup) => void
    server?: ServerState
}

export function CustomerGroupsTable({ groups, t, renderActions, onRowClick, server }: Props) {
    const columns = useMemo<DataGridColumnDef<CustomerGroup>[]>(
        () => [
            {
                id: 'code',
                header: t('customerGroups.fields.code'),
                icon: Hash,
                sortable: true,
                filterable: true,
                accessor: (g) => g.code,
                cell: (g) => <span className="font-mono text-xs">{g.code}</span>,
            },
            {
                id: 'name',
                header: t('customerGroups.fields.name'),
                icon: Tags,
                sortable: true,
                filterable: true,
                accessor: (g) => g.name,
                cell: (g) => <span className="font-medium">{g.name}</span>,
            },
            {
                id: 'description',
                header: t('customerGroups.fields.description'),
                icon: AlignLeft,
                filterable: true,
                accessor: (g) => g.description ?? '',
                cell: (g) => (
                    <span className="block max-w-md truncate text-muted-foreground" title={g.description ?? undefined}>
                        {g.description || '—'}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: t('customerGroups.table.actions'),
                icon: Settings2,
                align: 'right',
                locked: true,
                cell: (g) => renderActions(g),
            },
        ],
        [t, renderActions],
    )

    return (
        <DataGrid
            storageKey="customer-groups-list-grid"
            columns={columns}
            data={groups}
            getRowId={(g) => g.id}
            emptyMessage={t('customerGroups.table.empty')}
            server={server}
            onRowClick={onRowClick}
        />
    )
}

import { useMemo } from 'react'
import { Settings2, Tags, Hash } from 'lucide-react'
import type { MeasurementUnit } from '@/lib/api/query/measurementUnits'
import { DataGrid, type DataGridColumnDef } from '@/components/data-table'
import type { POSKasirInternalCommonPaginationPagination } from '@/lib/api/generated'
import { MeasurementUnitActions } from './MeasurementUnitActions'

type ServerState = {
    pagination?: POSKasirInternalCommonPaginationPagination
    onPageChange?: (page: number) => void
    onLimitChange?: (limit: number) => void
    isFetching?: boolean
}

type Props = {
    units: MeasurementUnit[]
    t: (key: string, fallback?: string) => string
    onRowClick?: (unit: MeasurementUnit) => void
    server?: ServerState
    canEdit: boolean
    canDelete: boolean
    onEdit: (unit: MeasurementUnit) => void
}

export function MeasurementUnitsTable({ units, t, onRowClick, server, canEdit, canDelete, onEdit }: Props) {
    const columns = useMemo<DataGridColumnDef<MeasurementUnit>[]>(
        () => [
            {
                id: 'code',
                header: t('measurementUnits.fields.code'),
                icon: Hash,
                sortable: true,
                filterable: true,
                accessor: (u) => u.code,
                cell: (u) => <span className="font-mono text-sm">{u.code}</span>,
            },
            {
                id: 'name',
                header: t('measurementUnits.fields.name'),
                icon: Tags,
                sortable: true,
                filterable: true,
                accessor: (u) => u.name,
                cell: (u) => <span className="font-medium">{u.name}</span>,
            },
            {
                id: 'actions',
                header: t('common.actions'),
                icon: Settings2,
                align: 'right',
                locked: true,
                cell: (u) =>
                    canEdit || canDelete ? (
                        <MeasurementUnitActions unit={u} onEdit={() => onEdit(u)} canEdit={canEdit} canDelete={canDelete} />
                    ) : null,
            },
        ],
        [t, canEdit, canDelete, onEdit],
    )

    return (
        <DataGrid
            storageKey="measurement-units-grid"
            columns={columns}
            data={units}
            getRowId={(u) => u.id}
            emptyMessage={t('measurementUnits.table.empty')}
            onRowClick={onRowClick}
            server={server}
        />
    )
}

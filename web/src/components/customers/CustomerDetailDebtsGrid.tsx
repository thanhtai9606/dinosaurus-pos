import { useMemo } from 'react'
import { CircleDollarSign, Hash } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DataGrid, type DataGridColumnDef } from '@/components/data-table'
import type { CustomerDebt } from '@/lib/api/query/customerDebts'
import type { POSKasirInternalCommonPaginationPagination } from '@/lib/api/generated'

type Props = {
    debts: CustomerDebt[]
    t: (key: string, fallback?: string) => string
    formatMoney: (amount: number) => string
    emptyMessage?: string
    server?: {
        pagination?: POSKasirInternalCommonPaginationPagination
        onPageChange?: (page: number) => void
        onLimitChange?: (limit: number) => void
        isFetching?: boolean
    }
}

export function CustomerDetailDebtsGrid({ debts, t, formatMoney, emptyMessage, server }: Props) {
    const columns = useMemo<DataGridColumnDef<CustomerDebt>[]>(
        () => [
            {
                id: 'reference',
                header: t('debts.fields.reference'),
                icon: Hash,
                sortable: true,
                filterable: true,
                accessor: (d) => d.reference_no ?? '',
                cell: (d) => <span className="font-mono text-xs">{d.reference_no || '—'}</span>,
            },
            {
                id: 'status',
                header: t('debts.fields.status'),
                filterable: true,
                accessor: (d) => d.status,
                cell: (d) => (
                    <Badge variant="secondary">{t(`debts.status.${d.status}`, d.status)}</Badge>
                ),
            },
            {
                id: 'balance',
                header: t('debts.fields.balance'),
                icon: CircleDollarSign,
                sortable: true,
                align: 'right',
                accessor: (d) => d.balance_due,
                cell: (d) => (
                    <span className="font-medium tabular-nums">{formatMoney(d.balance_due)}</span>
                ),
            },
        ],
        [t, formatMoney],
    )

    return (
        <DataGrid
            storageKey="customer-detail-debts-grid"
            columns={columns}
            data={debts}
            getRowId={(d) => d.id}
            emptyMessage={emptyMessage}
            server={server}
            defaultPageSize={10}
            className="rounded-md border"
        />
    )
}

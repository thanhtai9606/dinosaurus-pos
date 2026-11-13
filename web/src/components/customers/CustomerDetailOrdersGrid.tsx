import { useMemo } from 'react'
import { Calendar, CircleDollarSign, Hash } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DataGrid, type DataGridColumnDef } from '@/components/data-table'
import type { POSKasirInternalCommonPaginationPagination } from '@/lib/api/generated'

export type CustomerOrderRow = {
    id?: string
    order_no?: string
    queue_number?: string
    created_at?: string
    status?: string
    net_total?: number
}

type Props = {
    orders: CustomerOrderRow[]
    t: (key: string, fallback?: string) => string
    formatMoney: (amount: number) => string
    emptyMessage?: string
    onOrderClick?: (order: CustomerOrderRow) => void
    storageKey?: string
    server?: {
        pagination?: POSKasirInternalCommonPaginationPagination
        onPageChange?: (page: number) => void
        onLimitChange?: (limit: number) => void
        isFetching?: boolean
    }
}

export function CustomerDetailOrdersGrid({
    orders,
    t,
    formatMoney,
    emptyMessage,
    onOrderClick,
    storageKey = 'customer-detail-orders-grid',
    server,
}: Props) {
    const columns = useMemo<DataGridColumnDef<CustomerOrderRow>[]>(
        () => [
            {
                id: 'order_no',
                header: t('customers.detail.order_no', t('salesOrders.col_queue', 'Order no.')),
                icon: Hash,
                sortable: true,
                filterable: true,
                accessor: (o) => o.order_no || o.queue_number || o.id || '',
                cell: (o) => {
                    const label = o.order_no || o.queue_number || '—'
                    if (!o.id || !onOrderClick) {
                        return <span className="font-mono text-xs font-medium">{label}</span>
                    }
                    return (
                        <button
                            type="button"
                            className="font-mono text-xs font-medium text-primary underline-offset-4 hover:underline"
                            onClick={(e) => {
                                e.stopPropagation()
                                onOrderClick(o)
                            }}
                        >
                            {label}
                        </button>
                    )
                },
            },
            {
                id: 'created_at',
                header: t('customers.detail.order_date'),
                icon: Calendar,
                sortable: true,
                accessor: (o) => (o.created_at ? new Date(o.created_at).getTime() : 0),
                cell: (o) => (
                    <span className="text-xs">
                        {o.created_at ? new Date(o.created_at).toLocaleString() : '—'}
                    </span>
                ),
            },
            {
                id: 'status',
                header: t('customers.detail.order_status'),
                filterable: true,
                accessor: (o) => o.status ?? '',
                cell: (o) => (
                    <Badge variant="secondary">
                        {t(`transactions.status.${o.status}`, o.status ?? '')}
                    </Badge>
                ),
            },
            {
                id: 'net_total',
                header: t('customers.detail.order_total'),
                icon: CircleDollarSign,
                sortable: true,
                align: 'right',
                accessor: (o) => o.net_total ?? 0,
                cell: (o) => (
                    <span className="font-medium tabular-nums">{formatMoney(o.net_total || 0)}</span>
                ),
            },
        ],
        [t, formatMoney, onOrderClick],
    )

    return (
        <DataGrid
            storageKey={storageKey}
            columns={columns}
            data={orders}
            getRowId={(o) => o.id ?? `order-${o.created_at ?? ''}`}
            emptyMessage={emptyMessage}
            server={server}
            defaultPageSize={10}
            className="rounded-md border"
        />
    )
}

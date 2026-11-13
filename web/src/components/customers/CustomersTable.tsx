import { useMemo } from 'react'
import { Users, Phone, Mail, MapPin, Hash, Settings2, Tags } from 'lucide-react'
import type { CustomerProfile } from '@/lib/api/query/customers'
import { DataGrid, type DataGridColumnDef } from '@/components/data-table'
import type { POSKasirInternalCommonPaginationPagination } from '@/lib/api/generated'

type ServerState = {
    pagination?: POSKasirInternalCommonPaginationPagination
    onPageChange?: (page: number) => void
    onLimitChange?: (limit: number) => void
    isFetching?: boolean
}

interface CustomersTableProps {
    customers: CustomerProfile[]
    t: (key: string, fallback?: string) => string
    renderActions: (customer: CustomerProfile) => React.ReactNode
    onRowClick?: (customer: CustomerProfile) => void
    server?: ServerState
}

export function CustomersTable({ customers, t, renderActions, onRowClick, server }: CustomersTableProps) {
    const columns = useMemo<DataGridColumnDef<CustomerProfile>[]>(
        () => [
            {
                id: 'code',
                header: t('customers.table.code', 'Code'),
                icon: Hash,
                sortable: true,
                filterable: true,
                accessor: (c) => c.code ?? '',
                cell: (c) => <span className="font-mono text-xs">{c.code || '—'}</span>,
            },
            {
                id: 'name',
                header: t('customers.table.name', 'Name'),
                icon: Users,
                sortable: true,
                filterable: true,
                accessor: (c) => c.name ?? '',
                cell: (c) => <span className="font-medium">{c.name}</span>,
            },
            {
                id: 'group',
                header: t('customers.table.group', 'Group'),
                icon: Tags,
                filterable: true,
                accessor: (c) => c.customer_group_name ?? '',
                cell: (c) => c.customer_group_name || '—',
            },
            {
                id: 'phone',
                header: t('customers.table.phone', 'Phone'),
                icon: Phone,
                filterable: true,
                accessor: (c) => c.phone ?? '',
                cell: (c) => c.phone || '—',
            },
            {
                id: 'email',
                header: t('customers.table.email', 'Email'),
                icon: Mail,
                filterable: true,
                accessor: (c) => c.email ?? '',
                cell: (c) => c.email || '—',
            },
            {
                id: 'address',
                header: t('customers.table.address', 'Address'),
                icon: MapPin,
                filterable: true,
                accessor: (c) => c.address ?? '',
                cell: (c) => (
                    <span className="max-w-[200px] truncate block" title={c.address ?? undefined}>
                        {c.address || '—'}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: t('customers.table.actions', 'Actions'),
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
            storageKey="customers-list-grid"
            columns={columns}
            data={customers}
            getRowId={(c) => c.id!}
            emptyMessage={t('customers.table.empty', 'No customers found.')}
            server={server}
            onRowClick={onRowClick}
        />
    )
}

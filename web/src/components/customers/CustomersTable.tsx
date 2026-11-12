import { useMemo } from 'react'
import { Users, Phone, Mail, MapPin, Settings2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { InternalCustomersCustomerResponse } from '@/lib/api/generated'
import { TableColumnHeader } from '@/components/data-table/TableColumnHeader'
import { useClientSort } from '@/hooks/use-client-sort'

interface CustomersTableProps {
    customers: InternalCustomersCustomerResponse[]
    t: any
    renderActions: (customer: InternalCustomersCustomerResponse) => React.ReactNode
    onRowClick?: (customer: InternalCustomersCustomerResponse) => void
}

export function CustomersTable({ customers, t, renderActions, onRowClick }: CustomersTableProps) {
    const getters = useMemo(
        () => ({
            name: (c: InternalCustomersCustomerResponse) => c.name ?? '',
        }),
        []
    )
    const { sorted, toggleSort, getSortDirection } = useClientSort(customers, getters)

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>
                            <TableColumnHeader title={t('customers.table.code', 'Code')} />
                        </TableHead>
                        <TableHead>
                            <TableColumnHeader
                                title={t('customers.table.name', 'Name')}
                                icon={Users}
                                sort={getSortDirection('name')}
                                onSort={() => toggleSort('name')}
                            />
                        </TableHead>
                        <TableHead>
                            <TableColumnHeader title={t('customers.table.phone', 'Phone')} icon={Phone} />
                        </TableHead>
                        <TableHead>
                            <TableColumnHeader title={t('customers.table.email', 'Email')} icon={Mail} />
                        </TableHead>
                        <TableHead>
                            <TableColumnHeader title={t('customers.table.address', 'Address')} icon={MapPin} />
                        </TableHead>
                        <TableHead className="text-right">
                            <TableColumnHeader
                                title={t('customers.table.actions', 'Actions')}
                                icon={Settings2}
                                align="right"
                            />
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sorted.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center">
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <Users className="h-8 w-8 opacity-40" />
                                    {t('customers.table.empty', 'No customers found.')}
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        sorted.map((customer) => (
                            <TableRow
                                key={customer.id}
                                className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : undefined}
                                onClick={() => onRowClick?.(customer)}
                            >
                                <TableCell className="font-mono text-xs">{customer.code || '—'}</TableCell>
                                <TableCell className="font-medium">{customer.name}</TableCell>
                                <TableCell>{customer.phone || '-'}</TableCell>
                                <TableCell>{customer.email || '-'}</TableCell>
                                <TableCell>{customer.address || '-'}</TableCell>
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                    {renderActions(customer)}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

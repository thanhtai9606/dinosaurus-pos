import { Utensils, ShoppingBag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTableSkeleton } from '@/components/ui/list-skeletons'
import { useFormatMoney } from '@/context/MoneyContext'
import { POSKasirInternalOrdersRepositoryOrderStatus } from '@/lib/api/generated'

type OrderRow = {
    id?: string
    user_id?: string
    type?: string
    status?: string
    created_at?: string
    net_total?: number
    queue_number?: string
    is_paid?: boolean
    items?: Array<{ product_name?: string; quantity?: number }>
}

export function SalesOrdersTable({
    orders,
    isLoading,
    userMap,
    onRowClick,
    t,
}: {
    orders: OrderRow[]
    isLoading: boolean
    userMap: Map<string, string>
    onRowClick: (order: OrderRow) => void
    t: (key: string, fallback?: string) => string
}) {
    const formatMoney = useFormatMoney()

    if (isLoading) {
        return <DataTableSkeleton rows={8} columns={6} />
    }

    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-muted/50">
                    <TableHead>{t('salesOrders.col_queue')}</TableHead>
                    <TableHead>{t('salesOrders.col_time')}</TableHead>
                    <TableHead>{t('transactions.table.cashier')}</TableHead>
                    <TableHead>{t('transactions.table.items')}</TableHead>
                    <TableHead>{t('transactions.table.total')}</TableHead>
                    <TableHead>{t('transactions.table.status')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                            {t('salesOrders.empty')}
                        </TableCell>
                    </TableRow>
                ) : (
                    orders.map((order) => (
                        <TableRow
                            key={order.id}
                            className="cursor-pointer hover:bg-muted/40"
                            onClick={() => onRowClick(order)}
                        >
                            <TableCell className="font-mono font-medium">
                                {order.queue_number || order.id?.slice(0, 6) || '—'}
                            </TableCell>
                            <TableCell className="text-sm">
                                <div className="flex items-center gap-2">
                                    {order.type === 'dine_in' ? (
                                        <Utensils className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span>
                                        {order.created_at
                                            ? new Date(order.created_at).toLocaleString()
                                            : '—'}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-sm">{userMap.get(order.user_id || '') || '—'}</TableCell>
                            <TableCell className="max-w-[240px] text-sm text-muted-foreground">
                                {order.items?.slice(0, 2).map((item, idx) => (
                                    <span key={idx} className="block truncate">
                                        {item.quantity}× {item.product_name}
                                    </span>
                                ))}
                                {(order.items?.length || 0) > 2 && (
                                    <span className="text-xs italic">+{(order.items?.length || 0) - 2}</span>
                                )}
                            </TableCell>
                            <TableCell className="font-mono text-sm font-semibold">
                                {formatMoney(order.net_total || 0)}
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        order.status === POSKasirInternalOrdersRepositoryOrderStatus.OrderStatusPaid
                                            ? 'default'
                                            : order.status ===
                                                POSKasirInternalOrdersRepositoryOrderStatus.OrderStatusCancelled
                                              ? 'destructive'
                                              : 'secondary'
                                    }
                                >
                                    {order.status ? t(`transactions.status.${order.status}`) : '—'}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    )
}

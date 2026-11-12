import { ShoppingBag, Utensils, User, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DataTableSkeleton } from '@/components/ui/list-skeletons'
import { useFormatMoney } from '@/context/MoneyContext'
import { POSKasirInternalOrdersRepositoryOrderStatus } from '@/lib/api/generated'
import { cn } from '@/lib/utils'

type OrderRow = {
    id?: string
    user_id?: string
    type?: string
    status?: string
    created_at?: string
    net_total?: number
    order_no?: string
    queue_number?: string
    is_paid?: boolean
    items?: Array<{ product_name?: string; quantity?: number }>
}

const statusBorder: Record<string, string> = {
    open: 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20',
    in_progress: 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20',
    served: 'border-l-violet-500 bg-violet-50/50 dark:bg-violet-950/20',
    paid: 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20',
    cancelled: 'border-l-muted-foreground bg-muted/40',
}

export function SalesOrdersCardGrid({
    orders,
    isLoading,
    userMap,
    onOrderClick,
    t,
}: {
    orders: OrderRow[]
    isLoading: boolean
    userMap: Map<string, string>
    onOrderClick: (order: OrderRow) => void
    t: (key: string, fallback?: string) => string
}) {
    const formatMoney = useFormatMoney()

    if (isLoading) {
        return <DataTableSkeleton rows={6} columns={3} />
    }

    if (orders.length === 0) {
        return (
            <p className="py-16 text-center text-sm text-muted-foreground">{t('salesOrders.empty')}</p>
        )
    }

    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {orders.map((order) => {
                const code = order.order_no || order.queue_number || '—'
                const status = order.status ?? ''
                const border = statusBorder[status] ?? 'border-l-border bg-card'
                const cashier = userMap.get(order.user_id || '') ?? '—'
                const itemPreview = (order.items ?? [])
                    .slice(0, 4)
                    .map((i) => `${i.quantity ?? 1}× ${i.product_name ?? '—'}`)
                    .join(' · ')
                const more = (order.items?.length ?? 0) > 4 ? ` +${(order.items?.length ?? 0) - 4}` : ''

                return (
                    <Card
                        key={order.id}
                        className={cn(
                            'cursor-pointer border-l-4 transition-shadow hover:shadow-md',
                            border,
                        )}
                        onClick={() => onOrderClick(order)}
                    >
                        <CardContent className="p-4">
                            <div className="mb-2 flex items-start justify-between gap-2">
                                <div>
                                    <p className="font-mono text-lg font-semibold leading-tight">{code}</p>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                        {order.type === 'dine_in' ? (
                                            <Utensils className="h-3.5 w-3.5" />
                                        ) : (
                                            <ShoppingBag className="h-3.5 w-3.5" />
                                        )}
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>
                                            {order.created_at
                                                ? new Date(order.created_at).toLocaleString()
                                                : '—'}
                                        </span>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="shrink-0 font-normal">
                                    {t(`transactions.status.${status}`, status)}
                                </Badge>
                            </div>
                            <div className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                                <User className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{cashier}</span>
                            </div>
                            {itemPreview ? (
                                <p className="mb-3 line-clamp-2 text-sm text-foreground/90">
                                    {itemPreview}
                                    {more}
                                </p>
                            ) : null}
                            <div className="flex items-center justify-between border-t pt-2">
                                <span className="text-xs text-muted-foreground">
                                    {order.is_paid ||
                                    status === POSKasirInternalOrdersRepositoryOrderStatus.OrderStatusPaid
                                        ? t('transactions.status_badge.paid', 'Paid')
                                        : t('transactions.status_badge.unpaid', 'Unpaid')}
                                </span>
                                <span className="text-base font-semibold tabular-nums">
                                    {formatMoney(order.net_total ?? 0)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}

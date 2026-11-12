import { Badge } from '@/components/ui/badge'
import { Receipt, User } from 'lucide-react'
import type { ReactNode } from 'react'
import { orderItemCode, orderItemLineTotal, type OrderItemRow } from '@/components/sales-orders/orderDetailShared'

type OrderLike = {
    order_no?: string
    created_at?: string
    type?: string
    status?: string
    gross_total?: number
    discount_amount?: number
    tax_amount?: number
    service_charge_amount?: number
    net_total?: number
    cash_received?: number
    change_due?: number
    applied_promotion_id?: string
    items?: OrderItemRow[]
}

export function OrderDetailReceiptView({
    order,
    customerName,
    customerCode,
    cashierName,
    formatMoney,
    t,
}: {
    order: OrderLike
    customerName: ReactNode
    customerCode?: string
    cashierName: ReactNode
    formatMoney: (n: number) => string
    t: (key: string, fallback?: string) => string
}) {
    const items = order.items ?? []

    return (
        <div className="mx-auto w-full max-w-md space-y-4 rounded-lg border border-dashed bg-card p-4 shadow-sm">
            <div className="border-b border-dashed pb-4 text-center">
                <Receipt className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <p className="font-mono text-lg font-bold">{order.order_no ?? '—'}</p>
                <p className="text-xs text-muted-foreground">
                    {order.created_at ? new Date(order.created_at).toLocaleString() : '—'}
                </p>
                {order.status && (
                    <Badge variant="outline" className="mt-2 font-normal">
                        {t(`transactions.status.${order.status}`, order.status)}
                    </Badge>
                )}
            </div>

            <dl className="space-y-2 text-sm">
                {order.type && (
                    <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">{t('salesOrders.meta.order_type')}</dt>
                        <dd>{t(`transactions.type.${order.type}`, order.type)}</dd>
                    </div>
                )}
                <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{t('salesOrders.meta.customer_name')}</dt>
                    <dd className="text-right">{customerName}</dd>
                </div>
                {customerCode ? (
                    <div className="flex justify-between gap-2 font-mono text-xs">
                        <dt className="text-muted-foreground">{t('salesOrders.meta.customer_code')}</dt>
                        <dd>{customerCode}</dd>
                    </div>
                ) : null}
                <div className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-1 text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        {t('salesOrders.meta.cashier')}
                    </dt>
                    <dd>{cashierName}</dd>
                </div>
            </dl>

            <div className="border-y border-dashed py-3">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('salesOrders.section.lines')}
                </h4>
                <ul className="max-h-[min(40vh,20rem)] space-y-2 overflow-y-auto pr-1">
                    {items.map((item, index) => (
                        <li
                            key={item.id || `${item.product_id}-${index}`}
                            className="flex justify-between gap-3 text-sm"
                        >
                            <div className="min-w-0 flex-1">
                                <span className="font-medium">{item.quantity}×</span>{' '}
                                {item.product_name}
                                <p className="truncate font-mono text-[10px] text-muted-foreground">
                                    {orderItemCode(item)}
                                </p>
                            </div>
                            <span className="shrink-0 tabular-nums">
                                {formatMoney(orderItemLineTotal(item))}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t('salesOrders.totals.gross')}</dt>
                    <dd>{formatMoney(order.gross_total || 0)}</dd>
                </div>
                {(order.discount_amount ?? 0) > 0 && (
                    <div className="flex justify-between text-destructive">
                        <dt>{t('salesOrders.totals.discount')}</dt>
                        <dd>−{formatMoney(order.discount_amount || 0)}</dd>
                    </div>
                )}
                <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t('salesOrders.totals.tax')}</dt>
                    <dd>{formatMoney(order.tax_amount || 0)}</dd>
                </div>
                <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t('salesOrders.totals.service')}</dt>
                    <dd>{formatMoney(order.service_charge_amount || 0)}</dd>
                </div>
                <div className="flex justify-between border-t border-dashed pt-2 text-base font-semibold">
                    <dt>{t('salesOrders.field_total')}</dt>
                    <dd>{formatMoney(order.net_total || 0)}</dd>
                </div>
            </dl>
        </div>
    )
}

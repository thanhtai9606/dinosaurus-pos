import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
    Copy,
    Loader2,
    Pencil,
    Printer,
    Trash2,
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
    useOrderDetailQuery,
    usePrintInvoiceMutation,
    useUpdateOrderItemsMutation,
    useCancelOrderMutation,
    useRefundOrderMutation,
} from '@/lib/api/query/orders'
import { useCustomerDetailQuery } from '@/lib/api/query/customers'
import { useUserDetailQuery } from '@/lib/api/query/user'
import { useCancellationReasonsListQuery } from '@/lib/api/query/cancel-reason'
import { useFormatMoney } from '@/context/MoneyContext'
import { useRBAC } from '@/lib/auth/rbac'
import { CancellationDialog } from '@/components/transactions/CancellationDialog'
import { RefundDialog } from '@/components/transactions/RefundDialog'
import { POSKasirInternalOrdersRepositoryOrderStatus } from '@/lib/api/generated'
import type { InternalOrdersUpdateOrderItemsRequest } from '@/lib/api/generated'
import {
    getSalesOrdersDetailView,
    setSalesOrdersDetailView,
    type SalesOrdersDetailView,
} from '@/lib/ui/viewPreferences'
import { OrderDetailReceiptView } from '@/components/sales-orders/OrderDetailReceiptView'
import { SalesOrdersDetailViewToggle } from '@/components/sales-orders/SalesOrdersViewToggle'
import {
    orderItemCode,
    orderItemLineTotal,
    type OrderItemRow,
} from '@/components/sales-orders/orderDetailShared'

type OrderClipboardSource = {
    id?: string
    order_no?: string
    customer_id?: string
    user_id?: string
    created_at?: string
    status?: string
    gross_total?: number
    discount_amount?: number
    tax_amount?: number
    service_charge_amount?: number
    net_total?: number
    applied_promotion_id?: string
    items?: OrderItemRow[]
}

function buildOrderClipboardText(
    order: OrderClipboardSource,
    formatMoney: (n: number) => string,
    extras?: { customerName?: string; cashierName?: string },
) {
    const lines = [
        `Order: ${order.order_no ?? order.id ?? ''}`,
        `Customer: ${extras?.customerName ?? order.customer_id ?? '—'}`,
        `Cashier: ${extras?.cashierName ?? order.user_id ?? '—'}`,
        `Date: ${order.created_at ? new Date(order.created_at).toLocaleString() : ''}`,
        `Status: ${order.status ?? ''}`,
        `Gross: ${formatMoney(order.gross_total || 0)}`,
        `Discount: ${formatMoney(order.discount_amount || 0)}`,
        `Tax: ${formatMoney(order.tax_amount || 0)}`,
        `Service: ${formatMoney(order.service_charge_amount || 0)}`,
        `Net: ${formatMoney(order.net_total || 0)}`,
        order.applied_promotion_id ? `Promotion: ${order.applied_promotion_id}` : '',
        'Items:',
        ...(order.items || []).map((i) => {
            const unit = i.sale_unit_name ? ` ${i.sale_unit_name}` : ''
            const code = orderItemCode(i)
            const disc = i.discount_amount ?? 0
            return `  - [${code}] ${i.product_name} · ${i.quantity}${unit} @ ${formatMoney(i.price_at_sale ?? 0)}${disc > 0 ? ` −${formatMoney(disc)}` : ''} = ${formatMoney(orderItemLineTotal(i))}`
        }),
    ].filter(Boolean)
    return lines.join('\n')
}

function MetaField({
    label,
    value,
    mono,
    className,
}: {
    label: string
    value: ReactNode
    mono?: boolean
    className?: string
}) {
    return (
        <div className={className}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className={`mt-0.5 text-sm font-medium ${mono ? 'font-mono text-xs break-all' : ''}`}>
                {value ?? '—'}
            </dd>
        </div>
    )
}

export function OrderDetailDialog({
    orderId,
    open,
    onOpenChange,
    onChanged,
}: {
    orderId: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onChanged?: () => void
}) {
    const { t } = useTranslation()
    const formatMoney = useFormatMoney()
    const { canAccessApi } = useRBAC()

    const { data: order, isLoading, isError, refetch } = useOrderDetailQuery(orderId || '', {
        enabled: open && !!orderId,
    })

    const customerId = order?.customer_id ?? ''
    const userId = order?.user_id ?? ''
    const { data: customer } = useCustomerDetailQuery(customerId)
    const { data: cashier } = useUserDetailQuery(userId)

    const printMutation = usePrintInvoiceMutation()
    const updateItemsMutation = useUpdateOrderItemsMutation()
    const cancelMutation = useCancelOrderMutation()
    const refundMutation = useRefundOrderMutation()
    const { data: cancellationReasons } = useCancellationReasonsListQuery()

    const [adjustMode, setAdjustMode] = useState(false)
    const [draftQty, setDraftQty] = useState<Record<string, number>>({})

    const [cancelOpen, setCancelOpen] = useState(false)
    const [cancelReasonId, setCancelReasonId] = useState('')
    const [cancelNotes, setCancelNotes] = useState('')
    const [refundOpen, setRefundOpen] = useState(false)
    const [refundReason, setRefundReason] = useState('')
    const [detailView, setDetailView] = useState<SalesOrdersDetailView>(() => getSalesOrdersDetailView())

    const handleDetailViewChange = (view: SalesOrdersDetailView) => {
        setDetailView(view)
        setSalesOrdersDetailView(view)
        if (view === 'receipt') setAdjustMode(false)
    }

    useEffect(() => {
        if (!open) {
            setAdjustMode(false)
            setDraftQty({})
        }
    }, [open, orderId])

    useEffect(() => {
        if (!order?.items) return
        const next: Record<string, number> = {}
        for (const item of order.items as OrderItemRow[]) {
            if (item.product_id) next[item.product_id] = item.quantity ?? 1
        }
        setDraftQty(next)
    }, [order?.items, order?.id])

    const isOpen = order?.status === POSKasirInternalOrdersRepositoryOrderStatus.OrderStatusOpen
    const isPaid = order?.status === POSKasirInternalOrdersRepositoryOrderStatus.OrderStatusPaid
    const isCancelled =
        order?.status === POSKasirInternalOrdersRepositoryOrderStatus.OrderStatusCancelled

    const canPrint = canAccessApi('POST', '/orders/{id}/print') && printMutation.isAllowed
    const canAdjust =
        canAccessApi('PATCH', '/orders/{id}/items') && updateItemsMutation.isAllowed && isOpen
    const canCancel = canAccessApi('POST', '/orders/{id}/cancel') && cancelMutation.isAllowed && isOpen
    const canRefund =
        canAccessApi('POST', '/orders/{id}/refund') && refundMutation.isAllowed && isPaid

    const customerDisplayName = useMemo(() => {
        if (customer?.name) return customer.name
        if (order?.customer_id) return t('salesOrders.meta.loading_customer')
        return t('salesOrders.meta.walk_in')
    }, [customer?.name, order?.customer_id, t])

    const cashierDisplayName = useMemo(() => {
        if (cashier?.username) return cashier.username
        if (order?.user_id) return t('salesOrders.meta.loading_cashier')
        return '—'
    }, [cashier?.username, order?.user_id, t])

    const handleCopy = async () => {
        if (!order) return
        const text = buildOrderClipboardText(order, formatMoney, {
            customerName: customer?.name ?? (order.customer_id ? order.customer_id : undefined),
            cashierName: cashier?.username,
        })
        try {
            await navigator.clipboard.writeText(text)
            toast.success(t('salesOrders.actions.copy_success'))
        } catch {
            toast.error(t('salesOrders.actions.copy_failed'))
        }
    }

    const handlePrint = async () => {
        if (!order?.id) return
        await printMutation.mutateAsync({ id: order.id })
    }

    const handleSaveAdjust = async () => {
        if (!order?.id || order.version == null) return
        const items = (order.items as OrderItemRow[])
            .filter((i) => i.product_id && (draftQty[i.product_id] ?? 0) > 0)
            .map((i) => ({
                product_id: i.product_id!,
                quantity: draftQty[i.product_id!] ?? i.quantity ?? 1,
                options: i.options
                    ?.filter((o) => o.product_option_id != null)
                    .map((o) => ({ product_option_id: String(o.product_option_id!) })),
            }))
        if (items.length === 0) {
            toast.error(t('salesOrders.adjust_min_one'))
            return
        }
        const body: InternalOrdersUpdateOrderItemsRequest = {
            version: order.version,
            items,
        }
        await updateItemsMutation.mutateAsync({ id: order.id, body })
        setAdjustMode(false)
        await refetch()
        onChanged?.()
    }

    const handleConfirmCancel = async () => {
        if (!order?.id || !cancelReasonId) return
        await cancelMutation.mutateAsync({
            id: order.id,
            body: {
                cancellation_reason_id: Number(cancelReasonId),
                cancellation_notes: cancelNotes,
            },
        })
        setCancelOpen(false)
        onOpenChange(false)
        onChanged?.()
    }

    const handleConfirmRefund = async () => {
        if (!order?.id || !refundReason.trim()) return
        await refundMutation.mutateAsync({ id: order.id, body: { reason: refundReason } })
        setRefundOpen(false)
        onOpenChange(false)
        onChanged?.()
    }

    const displayOrderNo = order?.order_no

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    size={detailView === 'receipt' ? 'md' : 'xl'}
                    dismissible
                    scrollable={false}
                    className="flex max-h-[92vh] flex-col gap-4 overflow-hidden"
                >
                    <DialogHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                        <DialogTitle className="flex flex-wrap items-center gap-2">
                            {t('salesOrders.detail_title')}
                            {displayOrderNo && (
                                <span className="font-mono text-base font-normal text-muted-foreground">
                                    {displayOrderNo}
                                </span>
                            )}
                            {order?.status && (
                                <Badge variant="secondary">
                                    {t(`transactions.status.${order.status}`, order.status)}
                                </Badge>
                            )}
                        </DialogTitle>
                        {order && !isLoading ? (
                            <SalesOrdersDetailViewToggle
                                value={detailView}
                                onChange={handleDetailViewChange}
                                t={t}
                            />
                        ) : null}
                    </DialogHeader>

                    {isLoading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : isError || !order ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            {t('salesOrders.load_failed')}
                        </p>
                    ) : (
                        <>
                            {detailView === 'receipt' ? (
                                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                                    <OrderDetailReceiptView
                                        order={order}
                                        customerName={customerDisplayName}
                                        customerCode={customer?.code}
                                        cashierName={cashierDisplayName}
                                        formatMoney={formatMoney}
                                        t={t}
                                    />
                                </div>
                            ) : (
                            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                                <section className="rounded-lg border bg-muted/30 p-4">
                                    <h3 className="mb-3 text-sm font-semibold">
                                        {t('salesOrders.section.summary')}
                                    </h3>
                                    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        <MetaField
                                            label={t('salesOrders.meta.order_no')}
                                            value={order.order_no}
                                            mono
                                        />
                                        <MetaField
                                            label={t('salesOrders.meta.customer_code')}
                                            value={
                                                customer?.code ??
                                                (order.customer_id
                                                    ? t('salesOrders.meta.loading_customer')
                                                    : t('salesOrders.meta.walk_in'))
                                            }
                                            mono={!!customer?.code}
                                        />
                                        <MetaField
                                            label={t('salesOrders.meta.created_at')}
                                            value={
                                                order.created_at
                                                    ? new Date(order.created_at).toLocaleString()
                                                    : '—'
                                            }
                                        />
                                        <MetaField
                                            label={t('salesOrders.meta.customer_name')}
                                            value={customerDisplayName}
                                        />
                                        <MetaField
                                            label={t('salesOrders.meta.cashier')}
                                            value={cashierDisplayName}
                                        />
                                        <MetaField
                                            label={t('salesOrders.meta.status')}
                                            value={
                                                order.status ? (
                                                    <Badge variant="outline" className="font-normal">
                                                        {t(
                                                            `transactions.status.${order.status}`,
                                                            order.status,
                                                        )}
                                                    </Badge>
                                                ) : (
                                                    '—'
                                                )
                                            }
                                        />
                                        {order.type && (
                                            <MetaField
                                                label={t('salesOrders.meta.order_type')}
                                                value={t(`transactions.type.${order.type}`, order.type)}
                                            />
                                        )}
                                        {order.updated_at && (
                                            <MetaField
                                                label={t('salesOrders.meta.updated_at')}
                                                value={new Date(order.updated_at).toLocaleString()}
                                            />
                                        )}
                                        {order.payment_gateway_reference && (
                                            <MetaField
                                                label={t('salesOrders.meta.payment_ref')}
                                                value={order.payment_gateway_reference}
                                                mono
                                                className="sm:col-span-2"
                                            />
                                        )}
                                    </dl>
                                </section>

                                <section className="rounded-lg border p-4">
                                    <h3 className="mb-3 text-sm font-semibold">
                                        {t('salesOrders.section.lines')}
                                    </h3>
                                    <ScrollArea className="max-h-[min(55vh,28rem)] rounded-md border">
                                        <Table className="min-w-[56rem]">
                                            <TableHeader className="sticky top-0 z-10 bg-background">
                                                <TableRow>
                                                    <TableHead className="w-10 text-center">#</TableHead>
                                                    <TableHead className="w-32">
                                                        {t('salesOrders.field_barcode')}
                                                    </TableHead>
                                                    <TableHead className="min-w-[10rem]">
                                                        {t('salesOrders.field_item')}
                                                    </TableHead>
                                                    <TableHead className="w-20 text-center">
                                                        {t('salesOrders.field_unit')}
                                                    </TableHead>
                                                    <TableHead className="w-24 text-right">
                                                        {t('salesOrders.field_qty')}
                                                    </TableHead>
                                                    <TableHead className="w-28 text-right">
                                                        {t('salesOrders.field_unit_price')}
                                                    </TableHead>
                                                    <TableHead className="w-28 text-right">
                                                        {t('salesOrders.field_line_discount')}
                                                    </TableHead>
                                                    <TableHead className="w-32 text-right">
                                                        {t('salesOrders.field_line')}
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(order.items as OrderItemRow[] | undefined)?.map(
                                                    (item, index) => (
                                                        <TableRow
                                                            key={item.id || `${item.product_id}-${index}`}
                                                        >
                                                            <TableCell className="text-center text-muted-foreground">
                                                                {index + 1}
                                                            </TableCell>
                                                            <TableCell className="font-mono text-xs">
                                                                {orderItemCode(item)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div>{item.product_name}</div>
                                                                {item.options?.length ? (
                                                                    <ul className="mt-1 text-xs text-muted-foreground">
                                                                        {item.options.map((o) => (
                                                                            <li
                                                                                key={String(o.product_option_id)}
                                                                            >
                                                                                + {o.option_name}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                ) : null}
                                                            </TableCell>
                                                            <TableCell className="text-center text-sm">
                                                                {item.sale_unit_name || '—'}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {adjustMode &&
                                                                item.product_id &&
                                                                canAdjust ? (
                                                                    <Input
                                                                        type="number"
                                                                        min={1}
                                                                        className="ml-auto h-8 w-20 text-right"
                                                                        value={
                                                                            draftQty[item.product_id] ??
                                                                            item.quantity
                                                                        }
                                                                        onChange={(e) =>
                                                                            setDraftQty((prev) => ({
                                                                                ...prev,
                                                                                [item.product_id!]: Math.max(
                                                                                    1,
                                                                                    Number(e.target.value) || 1,
                                                                                ),
                                                                            }))
                                                                        }
                                                                    />
                                                                ) : (
                                                                    item.quantity
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right tabular-nums">
                                                                {formatMoney(item.price_at_sale ?? 0)}
                                                            </TableCell>
                                                            <TableCell className="text-right tabular-nums text-destructive">
                                                                {(item.discount_amount ?? 0) > 0
                                                                    ? `−${formatMoney(item.discount_amount ?? 0)}`
                                                                    : '—'}
                                                            </TableCell>
                                                            <TableCell className="text-right font-medium tabular-nums">
                                                                {formatMoney(orderItemLineTotal(item))}
                                                            </TableCell>
                                                        </TableRow>
                                                    ),
                                                )}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>

                                    <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
                                        <div className="flex justify-between gap-4">
                                            <dt className="text-muted-foreground">
                                                {t('salesOrders.totals.gross')}
                                            </dt>
                                            <dd>{formatMoney(order.gross_total || 0)}</dd>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <dt className="text-muted-foreground">
                                                {t('salesOrders.totals.discount')}
                                            </dt>
                                            <dd className="text-destructive">
                                                −{formatMoney(order.discount_amount || 0)}
                                            </dd>
                                        </div>
                                        {order.applied_promotion_id && (
                                            <div className="flex justify-between gap-4 text-xs">
                                                <dt className="text-muted-foreground">
                                                    {t('salesOrders.totals.promotion')}
                                                </dt>
                                                <dd className="max-w-[60%] truncate font-mono">
                                                    {order.applied_promotion_id}
                                                </dd>
                                            </div>
                                        )}
                                        <div className="flex justify-between gap-4">
                                            <dt className="text-muted-foreground">
                                                {t('salesOrders.totals.tax')}
                                            </dt>
                                            <dd>{formatMoney(order.tax_amount || 0)}</dd>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <dt className="text-muted-foreground">
                                                {t('salesOrders.totals.service')}
                                            </dt>
                                            <dd>{formatMoney(order.service_charge_amount || 0)}</dd>
                                        </div>
                                        {(order.cash_received != null && order.cash_received > 0) ||
                                        (order.change_due != null && order.change_due > 0) ? (
                                            <>
                                                <div className="flex justify-between gap-4">
                                                    <dt className="text-muted-foreground">
                                                        {t('salesOrders.totals.cash_received')}
                                                    </dt>
                                                    <dd>{formatMoney(order.cash_received || 0)}</dd>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <dt className="text-muted-foreground">
                                                        {t('salesOrders.totals.change')}
                                                    </dt>
                                                    <dd>{formatMoney(order.change_due || 0)}</dd>
                                                </div>
                                            </>
                                        ) : null}
                                        <div className="flex justify-between gap-4 border-t pt-2 text-base font-semibold">
                                            <dt>{t('salesOrders.field_total')}</dt>
                                            <dd>{formatMoney(order.net_total || 0)}</dd>
                                        </div>
                                    </dl>
                                </section>
                            </div>
                            )}

                            <DialogFooter className="flex flex-wrap gap-2 sm:justify-between">
                                <div className="flex flex-wrap gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
                                        <Copy className="mr-2 h-4 w-4" />
                                        {t('salesOrders.actions.copy')}
                                    </Button>
                                    {canPrint && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={printMutation.isPending}
                                            onClick={handlePrint}
                                        >
                                            {printMutation.isPending ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Printer className="mr-2 h-4 w-4" />
                                            )}
                                            {t('salesOrders.actions.print')}
                                        </Button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {canAdjust && !adjustMode && detailView === 'classic' && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setAdjustMode(true)}
                                        >
                                            <Pencil className="mr-2 h-4 w-4" />
                                            {t('salesOrders.actions.adjust')}
                                        </Button>
                                    )}
                                    {adjustMode && (
                                        <>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setAdjustMode(false)}
                                            >
                                                {t('common.cancel')}
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                disabled={updateItemsMutation.isPending}
                                                onClick={handleSaveAdjust}
                                            >
                                                {updateItemsMutation.isPending && (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                )}
                                                {t('salesOrders.actions.save_adjust')}
                                            </Button>
                                        </>
                                    )}
                                    {canCancel && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => setCancelOpen(true)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            {t('salesOrders.actions.delete_open')}
                                        </Button>
                                    )}
                                    {canRefund && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => setRefundOpen(true)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            {t('salesOrders.actions.delete_paid')}
                                        </Button>
                                    )}
                                    {isCancelled && (
                                        <span className="text-sm text-muted-foreground self-center">
                                            {t('salesOrders.actions.already_cancelled')}
                                        </span>
                                    )}
                                </div>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <CancellationDialog
                open={cancelOpen}
                onOpenChange={setCancelOpen}
                order={order}
                cancellationReasons={cancellationReasons}
                cancelReasonId={cancelReasonId}
                setCancelReasonId={setCancelReasonId}
                cancelNotes={cancelNotes}
                setCancelNotes={setCancelNotes}
                onConfirm={handleConfirmCancel}
                isPending={cancelMutation.isPending}
                t={t}
            />

            <RefundDialog
                open={refundOpen}
                onOpenChange={setRefundOpen}
                order={order}
                refundReason={refundReason}
                setRefundReason={setRefundReason}
                onConfirm={handleConfirmRefund}
                isPending={refundMutation.isPending}
                t={t}
            />
        </>
    )
}

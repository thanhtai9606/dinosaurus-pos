import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useOrderDetailQuery } from '@/lib/api/query/orders'
import { useFormatMoney } from '@/context/MoneyContext'

export function OrderDetailSheet({
    orderId,
    open,
    onOpenChange,
}: {
    orderId: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const { t } = useTranslation()
    const formatMoney = useFormatMoney()
    const { data: order, isLoading, isError } = useOrderDetailQuery(orderId || '', {
        enabled: open && !!orderId,
    })

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>{t('salesOrders.detail_title')}</SheetTitle>
                    <SheetDescription className="font-mono text-xs">
                        {orderId ? `${orderId.slice(0, 8)}…` : '—'}
                    </SheetDescription>
                </SheetHeader>
                {isLoading ? (
                    <div className="flex flex-1 items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : isError || !order ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">{t('salesOrders.load_failed')}</p>
                ) : (
                    <div className="space-y-4 pb-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">
                                {t(`transactions.status.${order.status}`, order.status)}
                            </Badge>
                            {order.is_paid ? (
                                <Badge>{t('transactions.status_badge.paid')}</Badge>
                            ) : (
                                <Badge variant="outline">{t('transactions.status_badge.unpaid')}</Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {order.created_at ? new Date(order.created_at).toLocaleString() : '—'}
                        </p>
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                            <dt className="text-muted-foreground">{t('salesOrders.field_total')}</dt>
                            <dd className="text-right font-semibold">{formatMoney(order.net_total || 0)}</dd>
                        </dl>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('salesOrders.field_item')}</TableHead>
                                    <TableHead className="text-right">{t('salesOrders.field_qty')}</TableHead>
                                    <TableHead className="text-right">{t('salesOrders.field_line')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(order.items || []).map((item: { id?: string; product_name?: string; quantity?: number; line_total?: number }) => (
                                    <TableRow key={item.id || item.product_name}>
                                        <TableCell>{item.product_name}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right">
                                            {formatMoney(item.line_total ?? 0)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}

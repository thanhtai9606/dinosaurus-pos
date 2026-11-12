import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { useOrderDetailQuery, useRefundOrderMutation } from '@/lib/api/query/orders'
import { useFormatMoney } from '@/context/MoneyContext'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function SalesReturnPanel({
    onSuccess,
    embedded = false,
}: {
    onSuccess?: () => void
    embedded?: boolean
}) {
    const { t } = useTranslation()
    const [orderId, setOrderId] = useState('')
    const [lookupId, setLookupId] = useState('')
    const [reason, setReason] = useState('')
    const formatMoney = useFormatMoney()
    const refundMutation = useRefundOrderMutation()

    const { data: order, isLoading, isError } = useOrderDetailQuery(lookupId, {
        enabled: !!lookupId,
    })

    const canRefund = !!order?.id && order.is_paid && order.status !== 'cancelled' && reason.trim().length > 0

    const reset = () => {
        setOrderId('')
        setLookupId('')
        setReason('')
    }

    const body = (
            <div className="space-y-4">
                <div>
                    <Label>{t('retailPos.return.order_id')}</Label>
                    <div className="mt-1 flex gap-2">
                        <Input
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            placeholder={t('retailPos.return.order_id_placeholder')}
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setLookupId(orderId.trim())}
                            disabled={!orderId.trim()}
                        >
                            {t('retailPos.return.lookup')}
                        </Button>
                    </div>
                </div>
                {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                {isError && lookupId && (
                    <p className="text-sm text-destructive">{t('retailPos.return.not_found')}</p>
                )}
                {order && (
                    <div className="space-y-2 rounded-md border p-3 text-sm">
                        <p className="font-medium font-mono">#{order.id?.slice(0, 8)}…</p>
                        <p>
                            {t('retailPos.return.total')}: {formatMoney(order.net_total || 0)}
                        </p>
                        <ul className="list-disc pl-4 text-muted-foreground">
                            {(order.items || []).map((item: { product_name?: string; quantity?: number }) => (
                                <li key={`${item.product_name}-${item.quantity}`}>
                                    {item.product_name} × {item.quantity}
                                </li>
                            ))}
                        </ul>
                        {!order.is_paid && (
                            <p className="text-xs text-destructive">{t('retailPos.return.not_paid')}</p>
                        )}
                    </div>
                )}
                <div>
                    <Label>{t('retailPos.return.reason')}</Label>
                    <Textarea className="mt-1" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
                <Button
                    variant="destructive"
                    disabled={!canRefund || refundMutation.isPending}
                    onClick={async () => {
                        if (!order?.id) return
                        await refundMutation.mutateAsync({ id: order.id, body: { reason } })
                        reset()
                        onSuccess?.()
                    }}
                >
                    {refundMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('retailPos.return.confirm')}
                </Button>
            </div>
    )

    if (embedded) return body

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('retailPos.return.title')}</CardTitle>
                <CardDescription>{t('sidebar.sales_returns_desc')}</CardDescription>
            </CardHeader>
            <CardContent>{body}</CardContent>
        </Card>
    )
}

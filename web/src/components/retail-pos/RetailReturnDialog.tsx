import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { useOrderDetailQuery, useRefundOrderMutation } from '@/lib/api/query/orders'
import { useFormatMoney } from '@/context/MoneyContext'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    t: (key: string, fallback?: string) => string
}

export function RetailReturnDialog({ open, onOpenChange, t }: Props) {
    const [orderId, setOrderId] = useState('')
    const [lookupId, setLookupId] = useState('')
    const [reason, setReason] = useState('')
    const formatMoney = useFormatMoney()
    const refundMutation = useRefundOrderMutation()

    const { data: order, isLoading, isError } = useOrderDetailQuery(lookupId, {
        enabled: open && !!lookupId,
    })

    const canRefund = !!order?.id && order.is_paid && order.status !== 'cancelled' && reason.trim().length > 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t('retailPos.return.title')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div>
                        <Label>{t('retailPos.return.order_id')}</Label>
                        <div className="flex gap-2 mt-1">
                            <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="UUID đơn hàng" />
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
                    {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                    {isError && lookupId && (
                        <p className="text-sm text-destructive">{t('retailPos.return.not_found')}</p>
                    )}
                    {order && (
                        <div className="rounded-md border p-3 text-sm space-y-2">
                            <p className="font-medium">#{order.id?.slice(0, 8)}…</p>
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
                                <p className="text-destructive text-xs">{t('retailPos.return.not_paid')}</p>
                            )}
                        </div>
                    )}
                    <div>
                        <Label>{t('retailPos.return.reason')}</Label>
                        <Textarea className="mt-1" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="destructive"
                        disabled={!canRefund || refundMutation.isPending}
                        onClick={async () => {
                            if (!order?.id) return
                            await refundMutation.mutateAsync({ id: order.id, body: { reason } })
                            onOpenChange(false)
                            setOrderId('')
                            setLookupId('')
                            setReason('')
                        }}
                    >
                        {refundMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('retailPos.return.confirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

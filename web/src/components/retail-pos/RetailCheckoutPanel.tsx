import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFormatMoney } from '@/context/MoneyContext'
import { useFinancialSettingsQuery } from '@/lib/api/query/settings'

type Props = {
    t: (key: string, fallback?: string) => string
    customers: Array<{ id?: string; name?: string }>
    selectedCustomerId: string | null
    onCustomerChange: (id: string | null) => void
    subtotal: number
    itemCount: number
    onPay: () => void
    canPay: boolean
    paying: boolean
}

export function RetailCheckoutPanel({
    t,
    customers,
    selectedCustomerId,
    onCustomerChange,
    subtotal,
    itemCount,
    onPay,
    canPay,
    paying,
}: Props) {
    const formatMoney = useFormatMoney()
    const { data: fin } = useFinancialSettingsQuery()
    const taxRate = fin?.tax_enabled ? (fin.tax_rate ?? 0) / 100 : 0
    const serviceRate = (fin?.service_charge_rate ?? 0) / 100
    const taxAmount = Math.floor(subtotal * taxRate)
    const serviceAmount = Math.floor(subtotal * serviceRate)
    const grandTotal = subtotal + taxAmount + serviceAmount

    return (
        <div className="flex h-full flex-col border-l bg-card">
            <div className="border-b p-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">{t('retailPos.customer')}</p>
                <Select value={selectedCustomerId || 'walk_in'} onValueChange={(v) => onCustomerChange(v === 'walk_in' ? null : v)}>
                    <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2 truncate">
                            <User className="h-4 w-4 shrink-0" />
                            <SelectValue placeholder={t('order.walk_in')} />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="walk_in">{t('retailPos.walk_in')}</SelectItem>
                        {customers.map((c) => (
                            <SelectItem key={c.id} value={c.id!}>
                                {c.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex-1 space-y-3 p-4 text-sm">
                <motionRow label={t('retailPos.totals.subtotal')} value={formatMoney(subtotal)} />
                {serviceAmount > 0 && (
                    <motionRow label={t('order.service_charge', 'Service')} value={formatMoney(serviceAmount)} />
                )}
                {taxAmount > 0 && <motionRow label={t('order.tax', 'Tax')} value={formatMoney(taxAmount)} />}
                <motionRow label={t('retailPos.totals.items')} value={String(itemCount)} bold={false} />
            </div>

            <div className="border-t bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between text-lg font-semibold">
                    <span>{t('retailPos.totals.due')}</span>
                    <span className="text-primary">{formatMoney(grandTotal)}</span>
                </div>
                <Button className="w-full h-12 text-base" size="lg" disabled={!canPay || paying} onClick={onPay}>
                    {t('retailPos.pay')}
                </Button>
            </div>
        </div>
    )
}

function motionRow({ label, value, bold = true }: { label: string; value: string; bold?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <span className={bold ? 'font-medium' : ''}>{value}</span>
        </div>
    )
}

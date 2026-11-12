import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFormatMoney } from '@/context/MoneyContext'
import { useFinancialSettingsQuery } from '@/lib/api/query/settings'
import { cn } from '@/lib/utils'

export type RetailSettlementMode = 'cash' | 'debt'

type Props = {
    t: (key: string, fallback?: string) => string
    customers: Array<{ id?: string; name?: string }>
    selectedCustomerId: string | null
    onCustomerChange: (id: string | null) => void
    subtotal: number
    itemCount: number
    taxAmount: number
    serviceAmount: number
    orderDiscount: number
    discountMode: 'amount' | 'percent'
    discountInput: string
    onDiscountModeChange: (m: 'amount' | 'percent') => void
    onDiscountInputChange: (v: string) => void
    grandTotal: number
    cashReceived: number
    onCashReceivedChange: (v: number) => void
    settlementMode: RetailSettlementMode
    onSettlementModeChange: (m: RetailSettlementMode) => void
    onPay: () => void
    onOtherPayment: () => void
    canPay: boolean
    paying: boolean
    quickAmounts: number[]
}

export function RetailCheckoutPanel({
    t,
    customers,
    selectedCustomerId,
    onCustomerChange,
    subtotal,
    itemCount,
    taxAmount,
    serviceAmount,
    orderDiscount,
    discountMode,
    discountInput,
    onDiscountModeChange,
    onDiscountInputChange,
    grandTotal,
    cashReceived,
    onCashReceivedChange,
    settlementMode,
    onSettlementModeChange,
    onPay,
    onOtherPayment,
    canPay,
    paying,
    quickAmounts,
}: Props) {
    const formatMoney = useFormatMoney()
    const changeDue = Math.max(0, cashReceived - grandTotal)
    const cashShort = settlementMode === 'cash' && cashReceived > 0 && cashReceived < grandTotal

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

            <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
                <Row label={t('retailPos.totals.subtotal')} value={formatMoney(subtotal)} />
                {orderDiscount > 0 && <Row label={t('retailPos.totals.discount')} value={`-${formatMoney(orderDiscount)}`} />}
                {serviceAmount > 0 && <Row label={t('order.service_charge', 'Service')} value={formatMoney(serviceAmount)} />}
                {taxAmount > 0 && <Row label={t('order.tax', 'Tax')} value={formatMoney(taxAmount)} />}
                <Row label={t('retailPos.totals.items')} value={String(itemCount)} bold={false} />

                <div className="space-y-2 pt-2 border-t">
                    <Label className="text-muted-foreground">{t('retailPos.totals.order_discount')}</Label>
                    <Tabs value={discountMode} onValueChange={(v) => onDiscountModeChange(v as 'amount' | 'percent')}>
                        <TabsList className="grid w-full grid-cols-2 h-8">
                            <TabsTrigger value="amount" className="text-xs">
                                VND
                            </TabsTrigger>
                            <TabsTrigger value="percent" className="text-xs">
                                %
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Input
                        type="number"
                        min={0}
                        placeholder={discountMode === 'percent' ? '0–100' : '0'}
                        value={discountInput}
                        onChange={(e) => onDiscountInputChange(e.target.value)}
                    />
                </div>

                <div className="space-y-2 pt-2 border-t">
                    <Label>{t('retailPos.cash.received')}</Label>
                    <Input
                        type="number"
                        min={0}
                        value={cashReceived || ''}
                        onChange={(e) => onCashReceivedChange(Math.floor(Number(e.target.value) || 0))}
                    />
                    <div className="flex flex-wrap gap-1.5">
                        {quickAmounts.map((amt) => (
                            <Button
                                key={amt}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => onCashReceivedChange(amt)}
                            >
                                {formatQuickLabel(amt)}
                            </Button>
                        ))}
                        <Button type="button" variant="secondary" size="sm" className="h-8 text-xs" onClick={() => onCashReceivedChange(grandTotal)}>
                            {t('retailPos.cash.exact')}
                        </Button>
                    </div>
                    <Row label={t('retailPos.cash.change')} value={formatMoney(changeDue)} bold={cashReceived > 0} />
                </div>

                <RadioGroup
                    value={settlementMode}
                    onValueChange={(v) => onSettlementModeChange(v as RetailSettlementMode)}
                    className="space-y-2 pt-2 border-t"
                >
                    <label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="cash" />
                        <span>{t('retailPos.settlement.change')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="debt" />
                        <span>{t('retailPos.settlement.debt')}</span>
                    </label>
                </RadioGroup>
                {settlementMode === 'debt' && !selectedCustomerId && (
                    <p className="text-xs text-destructive">{t('retailPos.settlement.debt_requires_customer')}</p>
                )}
            </div>

            <div className="border-t bg-muted/30 p-4 space-y-2">
                <div className="flex items-center justify-between text-lg font-semibold">
                    <span>{t('retailPos.totals.due')}</span>
                    <span className="text-primary">{formatMoney(grandTotal)}</span>
                </div>
                <Button
                    className="w-full h-11 text-base"
                    size="lg"
                    disabled={!canPay || paying || cashShort || (settlementMode === 'debt' && !selectedCustomerId)}
                    onClick={onPay}
                >
                    {settlementMode === 'debt' ? t('retailPos.pay_debt') : t('retailPos.pay_cash')}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={!canPay || paying || cartEmptyGuard(canPay)}
                    onClick={onOtherPayment}
                >
                    {t('retailPos.other_payment')}
                </Button>
            </div>
        </div>
    )
}

function cartEmptyGuard(canPay: boolean) {
    return !canPay
}

function formatQuickLabel(amt: number): string {
    if (amt >= 1000000) return `${amt / 1000000}tr`
    if (amt >= 1000) return `${amt / 1000}k`
    return String(amt)
}

function Row({ label, value, bold = true }: { label: string; value: string; bold?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <span className={cn(bold && 'font-medium')}>{value}</span>
        </div>
    )
}

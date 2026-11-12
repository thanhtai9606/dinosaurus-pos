import { Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useFormatMoney } from '@/context/MoneyContext'
import type { StockReceiptPaymentMode } from '@/lib/stock-receipts/paymentNote'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const QUICK_CASH = [100000, 200000, 500000, 1000000, 2000000, 5000000]

type Supplier = { id: string; name: string }

type Props = {
    t: (key: string, fallback?: string) => string
    suppliers: Supplier[]
    supplierId: string
    onSupplierChange: (id: string) => void
    note: string
    onNoteChange: (v: string) => void
    subtotal: number
    itemCount: number
    lineCount: number
    paymentMode: StockReceiptPaymentMode
    onPaymentModeChange: (m: StockReceiptPaymentMode) => void
    amountPaid: number
    onAmountPaidChange: (v: number) => void
    onSaveDraft: () => void
    onComplete: () => void
    canSave: boolean
    canComplete: boolean
    saving: boolean
    completing: boolean
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
        <div className={cn('flex justify-between gap-2', bold && 'font-semibold')}>
            <span className="text-muted-foreground">{label}</span>
            <span>{value}</span>
        </div>
    )
}

export function StockReceiptCheckoutPanel({
    t,
    suppliers,
    supplierId,
    onSupplierChange,
    note,
    onNoteChange,
    subtotal,
    itemCount,
    lineCount,
    paymentMode,
    onPaymentModeChange,
    amountPaid,
    onAmountPaidChange,
    onSaveDraft,
    onComplete,
    canSave,
    canComplete,
    saving,
    completing,
}: Props) {
    const formatMoney = useFormatMoney()
    const debt = Math.max(0, subtotal - amountPaid)
    const creditNeedsSupplier = paymentMode === 'credit' && !supplierId

    return (
        <div className="flex h-full flex-col border-l bg-card">
            <div className="border-b p-4">
                <p className="mb-2 text-sm font-medium text-muted-foreground">{t('stockReceipts.fields.supplier')}</p>
                <Select value={supplierId || ''} onValueChange={onSupplierChange}>
                    <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2 truncate">
                            <Truck className="h-4 w-4 shrink-0" />
                            <SelectValue placeholder={t('stockReceipts.fields.supplier_placeholder')} />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {suppliers.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                                {s.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
                <Row label={t('stockReceipts.checkout.subtotal')} value={formatMoney(subtotal)} />
                <Row label={t('stockReceipts.checkout.item_qty')} value={String(itemCount)} />
                <Row label={t('stockReceipts.form.line_count', { count: lineCount })} value={String(lineCount)} />

                <div className="space-y-2 border-t pt-2">
                    <Label className="text-muted-foreground">{t('stockReceipts.fields.note')}</Label>
                    <Textarea value={note} onChange={(e) => onNoteChange(e.target.value)} rows={3} className="resize-none text-sm" />
                </div>

                <RadioGroup
                    value={paymentMode}
                    onValueChange={(v) => onPaymentModeChange(v as StockReceiptPaymentMode)}
                    className="space-y-2 border-t pt-2"
                >
                    <label className="flex cursor-pointer items-center gap-2">
                        <RadioGroupItem value="cash" />
                        <span>{t('stockReceipts.checkout.pay_cash')}</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                        <RadioGroupItem value="credit" />
                        <span>{t('stockReceipts.checkout.pay_credit')}</span>
                    </label>
                </RadioGroup>
                {creditNeedsSupplier && (
                    <p className="text-xs text-destructive">{t('stockReceipts.checkout.credit_requires_supplier')}</p>
                )}

                <div className="space-y-2 border-t pt-2">
                    <Label>{t('stockReceipts.checkout.amount_paid')}</Label>
                    <Input
                        type="number"
                        min={0}
                        value={amountPaid || ''}
                        onChange={(e) => onAmountPaidChange(Math.floor(Number(e.target.value) || 0))}
                    />
                    <div className="flex flex-wrap gap-1.5">
                        {QUICK_CASH.map((amt) => (
                            <Button
                                key={amt}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => onAmountPaidChange(amt)}
                            >
                                {formatQuickLabel(amt)}
                            </Button>
                        ))}
                        <Button type="button" variant="secondary" size="sm" className="h-8 text-xs" onClick={() => onAmountPaidChange(subtotal)}>
                            {t('stockReceipts.checkout.pay_full')}
                        </Button>
                    </div>
                    <Row label={t('stockReceipts.checkout.debt')} value={formatMoney(debt)} bold={debt > 0} />
                </div>
            </div>

            <div className="space-y-2 border-t bg-muted/30 p-4">
                <div className="flex items-center justify-between text-lg font-semibold">
                    <span>{t('stockReceipts.checkout.grand_total')}</span>
                    <span className="text-primary">{formatMoney(subtotal)}</span>
                </div>
                <Button
                    className="h-11 w-full text-base"
                    size="lg"
                    disabled={!canComplete || completing || creditNeedsSupplier}
                    onClick={onComplete}
                >
                    {completing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('stockReceipts.actions.complete')}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={!canSave || saving}
                    onClick={onSaveDraft}
                >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('stockReceipts.checkout.save_draft')}
                </Button>
            </div>
        </div>
    )
}

function formatQuickLabel(amt: number) {
    if (amt >= 1_000_000) return `${amt / 1_000_000}M`
    if (amt >= 1_000) return `${amt / 1_000}k`
    return String(amt)
}

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useFormatMoney } from '@/context/MoneyContext'
import { Loader2 } from 'lucide-react'

type DebtLike = {
    id: string
    reference_no: string
    status: string
    total_amount: number
    amount_paid: number
    balance_due: number
    issued_at: string
    note?: string | null
    payments?: { id: string; amount: number; paid_at: string; note?: string | null }[]
}

type PartnerDebtDetailSheetProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    partnerLabel: string
    partnerName?: string
    debt?: DebtLike | null
    loading?: boolean
    canPay: boolean
    canVoid: boolean
    onPay: (amount: number, note?: string) => Promise<void>
    onVoid: () => Promise<void>
    paying?: boolean
    voiding?: boolean
}

export function PartnerDebtDetailSheet({
    open,
    onOpenChange,
    partnerLabel,
    partnerName,
    debt,
    loading,
    canPay,
    canVoid,
    onPay,
    onVoid,
    paying,
    voiding,
}: PartnerDebtDetailSheetProps) {
    const { t } = useTranslation()
    const formatMoney = useFormatMoney()
    const [amount, setAmount] = useState('')
    const [payNote, setPayNote] = useState('')

    useEffect(() => {
        if (debt && open) {
            setAmount(String(debt.balance_due > 0 ? debt.balance_due : ''))
            setPayNote('')
        }
    }, [debt, open])

    const canRecord = debt && (debt.status === 'open' || debt.status === 'partial') && debt.balance_due > 0

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>{debt?.reference_no || t('debts.detail_title')}</SheetTitle>
                    <SheetDescription>
                        {partnerLabel}: {partnerName || '—'}
                    </SheetDescription>
                </SheetHeader>
                {loading || !debt ? (
                    <div className="flex flex-1 items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-4 pb-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={debt.status === 'settled' ? 'default' : 'secondary'}>
                                {t(`debts.status.${debt.status}`, debt.status)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                                {new Date(debt.issued_at).toLocaleString()}
                            </span>
                        </div>
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                            <dt className="text-muted-foreground">{t('debts.fields.total')}</dt>
                            <dd className="text-right font-medium">{formatMoney(debt.total_amount)}</dd>
                            <dt className="text-muted-foreground">{t('debts.fields.paid')}</dt>
                            <dd className="text-right">{formatMoney(debt.amount_paid)}</dd>
                            <dt className="text-muted-foreground">{t('debts.fields.balance')}</dt>
                            <dd className="text-right font-semibold text-destructive">{formatMoney(debt.balance_due)}</dd>
                        </dl>
                        {debt.note && (
                            <p className="text-sm whitespace-pre-wrap rounded-md border bg-muted/30 p-2">{debt.note}</p>
                        )}
                        <div>
                            <h4 className="mb-2 text-sm font-medium">{t('debts.payment_history')}</h4>
                            {(debt.payments || []).length === 0 ? (
                                <p className="text-sm text-muted-foreground">{t('debts.no_payments')}</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('debts.fields.date')}</TableHead>
                                            <TableHead className="text-right">{t('debts.fields.amount')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(debt.payments || []).map((p) => (
                                            <TableRow key={p.id}>
                                                <TableCell className="text-xs">
                                                    {new Date(p.paid_at).toLocaleString()}
                                                    {p.note ? (
                                                        <span className="block text-muted-foreground">{p.note}</span>
                                                    ) : null}
                                                </TableCell>
                                                <TableCell className="text-right">{formatMoney(p.amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                        {canRecord && canPay && (
                            <div className="space-y-2 rounded-lg border p-3">
                                <h4 className="text-sm font-medium">{t('debts.record_payment')}</h4>
                                <Label>{t('debts.fields.amount')}</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    step="any"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                                <Label>{t('debts.fields.note')}</Label>
                                <Input value={payNote} onChange={(e) => setPayNote(e.target.value)} />
                                <Button
                                    className="w-full"
                                    disabled={paying || !amount || Number(amount) <= 0}
                                    onClick={() => onPay(Number(amount), payNote || undefined)}
                                >
                                    {paying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t('debts.actions.pay')}
                                </Button>
                            </div>
                        )}
                        {canVoid && debt.status !== 'void' && debt.status !== 'settled' && (
                            <Button variant="outline" className="w-full" disabled={voiding} onClick={() => onVoid()}>
                                {voiding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('debts.actions.void')}
                            </Button>
                        )}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}

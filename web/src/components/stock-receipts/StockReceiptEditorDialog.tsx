import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScanBarcode } from 'lucide-react'
import {
    useUpdateStockReceiptMutation,
    useDeleteStockReceiptMutation,
    useStockReceiptDetailQuery,
} from '@/lib/api/query/stockReceipts'
import { type StockReceiptPaymentMeta, type StockReceiptPaymentMode } from '@/lib/stock-receipts/paymentNote'
import type { StockReceipt } from '@/lib/api/query/stockReceipts'
import { useSuppliersListQuery } from '@/lib/api/query/suppliers'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { RetailProductSearchField } from '@/components/retail-pos/RetailProductSearchField'
import { StockReceiptLineItemsTable } from '@/components/stock-receipts/StockReceiptLineItemsTable'
import { useStockReceiptDraft } from '@/hooks/useStockReceiptDraft'
import { linesToApiItems } from '@/lib/stock-receipts/receiptLines'
import { useFormatMoney } from '@/context/MoneyContext'

export function StockReceiptEditorDialog({
    open,
    onOpenChange,
    receiptId,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    receiptId: string | null
}) {
    const { t } = useTranslation()
    const formatMoney = useFormatMoney()
    const updateMutation = useUpdateStockReceiptMutation()
    const deleteMutation = useDeleteStockReceiptMutation()
    const { data: detail, isFetching } = useStockReceiptDetailQuery(receiptId || '')
    const { data: suppliersData } = useSuppliersListQuery({ limit: 100 })

    const readOnly = Boolean(receiptId && detail && detail.status !== 'draft')
    const canDelete =
        Boolean(detail && (detail.status === 'draft' || detail.status === 'cancelled')) && deleteMutation.isAllowed

    const [supplierId, setSupplierId] = useState<string>('')
    const [note, setNote] = useState('')
    const [paymentMeta, setPaymentMeta] = useState<StockReceiptPaymentMeta | undefined>()
    const [deleteOpen, setDeleteOpen] = useState(false)

    const draft = useStockReceiptDraft({ open, receiptId, detail, readOnly, t })

    useEffect(() => {
        if (!open) return
        if (receiptId && detail) {
            setSupplierId(detail.supplier_id || '')
            setNote(detail.note ?? '')
            setPaymentMeta(resolvePaymentMeta(detail))
        }
    }, [open, receiptId, detail])

    if (!receiptId) return null

    const suppliers = suppliersData?.suppliers || []
    const pending = updateMutation.isPending
    const items = linesToApiItems(draft.lines)
    const receiptTotal = draft.lines.reduce((sum, l) => sum + l.quantity * l.unit_cost, 0)
    const debt =
        paymentMeta && paymentMeta.mode === 'credit'
            ? Math.max(0, receiptTotal - paymentMeta.amount_paid)
            : 0

    const handleSave = async () => {
        if (!updateMutation.isAllowed) return
        const body: Record<string, unknown> = {
            supplier_id: supplierId || undefined,
            note: note || undefined,
            items,
        }
        if (paymentMeta) {
            body.payment_mode = paymentMeta.mode
            body.amount_paid = paymentMeta.amount_paid
        }
        await updateMutation.mutateAsync({ id: receiptId, body })
        onOpenChange(false)
    }

    const handleDelete = async () => {
        if (!receiptId || !canDelete) return
        await deleteMutation.mutateAsync(receiptId)
        setDeleteOpen(false)
        onOpenChange(false)
    }

    const title = readOnly ? t('stockReceipts.form.view_title') : t('stockReceipts.form.edit_title')

    return (
        <>
        <Dialog open={open && !!receiptId} onOpenChange={onOpenChange}>
            <DialogContent size="full" dismissible className="flex flex-col gap-4 p-6" scrollable>
                <DialogHeader>
                    <div className="flex flex-wrap items-center gap-2">
                        <DialogTitle className="text-base">{title}</DialogTitle>
                        {detail?.receipt_no && (
                            <span className="text-sm text-muted-foreground font-mono">{detail.receipt_no}</span>
                        )}
                        {detail?.status && (
                            <Badge variant={detail.status === 'completed' ? 'default' : 'secondary'}>
                                {t(`stockReceipts.status.${detail.status}`, detail.status)}
                            </Badge>
                        )}
                    </div>
                    {readOnly ? (
                        <DialogDescription>{t('stockReceipts.form.readonly_hint')}</DialogDescription>
                    ) : (
                        <DialogDescription asChild>
                            <div className="space-y-1 text-left">
                                <p>{t('stockReceipts.form.scan_hint')}</p>
                                <p>{t('stockReceipts.form.cost_note')}</p>
                                <p>{t('stockReceipts.form.sell_note')}</p>
                            </div>
                        </DialogDescription>
                    )}
                </DialogHeader>
                {receiptId && isFetching && !detail ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <Label>{t('stockReceipts.fields.supplier')}</Label>
                                {readOnly ? (
                                    <p className="mt-1 text-sm">{detail?.supplier_name || '—'}</p>
                                ) : (
                                    <Select value={supplierId} onValueChange={setSupplierId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('stockReceipts.fields.supplier_placeholder')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers.map((s) => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <div>
                                <Label>{t('stockReceipts.fields.note')}</Label>
                                {readOnly ? (
                                    <p className="mt-1 text-sm whitespace-pre-wrap">{note || '—'}</p>
                                ) : (
                                    <Input value={note} onChange={(e) => setNote(e.target.value)} />
                                )}
                            </div>
                        </div>

                        {!readOnly && (
                            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
                                <ScanBarcode className="h-5 w-5 shrink-0 text-primary" />
                                <RetailProductSearchField
                                    wrapperClassName="w-full max-w-none shrink basis-full"
                                    placeholder={t('stockReceipts.form.search_placeholder')}
                                    value={draft.search}
                                    onChange={draft.setSearch}
                                    inputRef={draft.searchRef}
                                    onSubmit={draft.resolveAndAdd}
                                    onPickProduct={draft.addProduct}
                                    t={t}
                                    busy={draft.scanning}
                                />
                            </div>
                        )}

                        <StockReceiptLineItemsTable
                            lines={draft.lines}
                            readOnly={readOnly}
                            t={t}
                            onUpdateQuantity={draft.updateQuantity}
                            onSetUnitCost={draft.setUnitCost}
                            onSetUnitSell={draft.setUnitSell}
                            onRemove={draft.removeLine}
                        />

                        {paymentMeta && (
                            <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
                                <p>
                                    {paymentMeta.mode === 'credit'
                                        ? t('stockReceipts.checkout.pay_credit')
                                        : t('stockReceipts.checkout.pay_cash')}
                                </p>
                                <p>
                                    {t('stockReceipts.checkout.amount_paid')}: {formatMoney(paymentMeta.amount_paid)}
                                </p>
                                {debt > 0 && (
                                    <p className="font-medium text-destructive">
                                        {t('stockReceipts.checkout.debt')}: {formatMoney(debt)}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                {t('stockReceipts.form.line_count', { count: draft.lines.length })}
                            </span>
                            <span className="font-semibold">
                                {t('stockReceipts.fields.total')}: {formatMoney(receiptTotal)}
                            </span>
                        </div>

                        <DialogFooter className="gap-2 sm:justify-between">
                            {canDelete ? (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    disabled={deleteMutation.isPending}
                                    onClick={() => setDeleteOpen(true)}
                                >
                                    {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t('stockReceipts.bulk.delete')}
                                </Button>
                            ) : (
                                <span />
                            )}
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    {t('common.close', 'Close')}
                                </Button>
                                {!readOnly && updateMutation.isAllowed && (
                                    <Button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={pending || items.length === 0}
                                    >
                                        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {t('common.save')}
                                    </Button>
                                )}
                            </div>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('stockReceipts.bulk.delete_confirm_title')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('stockReceipts.bulk.delete_confirm_body')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>{t('stockReceipts.bulk.delete')}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    )
}

function resolvePaymentMeta(detail: StockReceipt): StockReceiptPaymentMeta | undefined {
    if (!detail.payment_mode) return undefined
    return {
        mode: detail.payment_mode as StockReceiptPaymentMode,
        amount_paid: detail.amount_paid ?? 0,
    }
}

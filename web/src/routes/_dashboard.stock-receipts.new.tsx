import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowLeft, ClipboardList, ScanBarcode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RetailProductSearchField } from '@/components/retail-pos/RetailProductSearchField'
import { StockReceiptLineItemsTable } from '@/components/stock-receipts/StockReceiptLineItemsTable'
import { StockReceiptCheckoutPanel } from '@/components/stock-receipts/StockReceiptCheckoutPanel'
import { useStockReceiptDraft } from '@/hooks/useStockReceiptDraft'
import { linesToApiItems } from '@/lib/stock-receipts/receiptLines'
import type { StockReceiptPaymentMode } from '@/lib/stock-receipts/paymentNote'
import {
    useCompleteStockReceiptMutation,
    useCreateStockReceiptMutation,
} from '@/lib/api/query/stockReceipts'
import { useSuppliersListQuery } from '@/lib/api/query/suppliers'
export const Route = createFileRoute('/_dashboard/stock-receipts/new')({
    component: StockReceiptNewPage,
})

function StockReceiptNewPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const createMutation = useCreateStockReceiptMutation()
    const completeMutation = useCompleteStockReceiptMutation()
    const { data: suppliersData } = useSuppliersListQuery({ limit: 200 })

    const [supplierId, setSupplierId] = useState('')
    const [note, setNote] = useState('')
    const [paymentMode, setPaymentMode] = useState<StockReceiptPaymentMode>('cash')
    const [amountPaid, setAmountPaid] = useState(0)
    const [busyAction, setBusyAction] = useState<'draft' | 'complete' | null>(null)

    const draft = useStockReceiptDraft({
        open: true,
        receiptId: null,
        detail: undefined,
        readOnly: false,
        t,
    })

    const subtotal = useMemo(
        () => draft.lines.reduce((sum, l) => sum + l.quantity * l.unit_cost, 0),
        [draft.lines],
    )
    const itemCount = useMemo(() => draft.lines.reduce((n, l) => n + l.quantity, 0), [draft.lines])

    useEffect(() => {
        if (paymentMode === 'cash' && subtotal > 0 && amountPaid === 0) {
            setAmountPaid(subtotal)
        }
    }, [paymentMode, subtotal, amountPaid])

    const suppliers = (suppliersData?.suppliers || []).filter((s) => s.id) as { id: string; name: string }[]
    const items = linesToApiItems(draft.lines)
    const canAct = items.length > 0 && createMutation.isAllowed

    const buildBody = () => ({
        supplier_id: supplierId || undefined,
        note: note || undefined,
        payment_mode: paymentMode,
        amount_paid: amountPaid,
        items,
    })

    const handleSaveDraft = async () => {
        setBusyAction('draft')
        try {
            await createMutation.mutateAsync(buildBody())
            toast.success(t('stockReceipts.messages.create_success'))
            navigate({ to: '/stock-receipts' })
        } catch {
            toast.error(t('stockReceipts.messages.draft_failed', 'Không lưu được phiếu nháp'))
        } finally {
            setBusyAction(null)
        }
    }

    const handleComplete = async () => {
        if (paymentMode === 'credit' && !supplierId) {
            toast.error(t('stockReceipts.checkout.credit_requires_supplier'))
            return
        }
        setBusyAction('complete')
        try {
            const receipt = await createMutation.mutateAsync(buildBody())
            if (completeMutation.isAllowed && receipt.id) {
                await completeMutation.mutateAsync(receipt.id)
            }
            toast.success(t('stockReceipts.messages.complete_success'))
            navigate({ to: '/stock-receipts' })
        } catch {
            toast.error(t('stockReceipts.messages.complete_failed'))
        } finally {
            setBusyAction(null)
        }
    }

    const saving = busyAction === 'draft'
    const completing = busyAction === 'complete'

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-xl border bg-background">
            <header className="flex shrink-0 items-center gap-2 border-b bg-muted/30 px-4 py-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/stock-receipts" search={{}}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <ClipboardList className="h-5 w-5 text-primary" />
                <div className="flex-1">
                    <p className="text-sm font-semibold">{t('stockReceipts.form.create_title')}</p>
                    <p className="text-xs text-muted-foreground">{t('stockReceipts.checkout.subtitle')}</p>
                </div>
            </header>

            <div className="flex min-h-0 flex-1">
                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex shrink-0 items-center gap-2 border-b bg-background px-3 py-2">
                        <ScanBarcode className="h-5 w-5 shrink-0 text-primary" />
                        <RetailProductSearchField
                            wrapperClassName="w-full max-w-none shrink basis-full"
                            placeholder={t('stockReceipts.form.search_placeholder')}
                            value={draft.search}
                            onChange={draft.setSearch}
                            inputRef={draft.searchRef}
                            onSubmit={draft.resolveAndAdd}
                            onPickProduct={draft.addProduct}
                            busy={draft.scanning}
                            t={t}
                        />
                    </div>
                    <div className="min-h-0 flex-1 p-2">
                        <StockReceiptLineItemsTable
                            lines={draft.lines}
                            readOnly={false}
                            t={t}
                            onUpdateQuantity={draft.updateQuantity}
                            onSetUnitCost={draft.setUnitCost}
                            onSetUnitSell={draft.setUnitSell}
                            onRemove={draft.removeLine}
                        />
                    </div>
                </div>

                <div className="w-[min(100%,22rem)] shrink-0 xl:w-[min(24rem,100%)]">
                    <StockReceiptCheckoutPanel
                        t={t}
                        suppliers={suppliers}
                        supplierId={supplierId}
                        onSupplierChange={setSupplierId}
                        note={note}
                        onNoteChange={setNote}
                        subtotal={subtotal}
                        itemCount={itemCount}
                        lineCount={draft.lines.length}
                        paymentMode={paymentMode}
                        onPaymentModeChange={(m) => {
                            setPaymentMode(m)
                            if (m === 'credit') setAmountPaid(0)
                            else setAmountPaid(subtotal)
                        }}
                        amountPaid={amountPaid}
                        onAmountPaidChange={setAmountPaid}
                        onSaveDraft={() => void handleSaveDraft()}
                        onComplete={() => void handleComplete()}
                        canSave={canAct}
                        canComplete={canAct && completeMutation.isAllowed}
                        saving={saving}
                        completing={completing}
                    />
                </div>
            </div>
        </div>
    )
}

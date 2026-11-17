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
import { useWarehousesListQuery } from '@/lib/api/query/warehouses'
import { getApiErrorMessage } from '@/lib/api/errorMessage'
import { httpStatus } from '@/lib/api/httpStatus'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export const Route = createFileRoute('/_dashboard/stock-receipts/new')({
    component: StockReceiptNewPage,
})

function StockReceiptNewPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const createMutation = useCreateStockReceiptMutation()
    const completeMutation = useCompleteStockReceiptMutation()
    const { data: suppliersData } = useSuppliersListQuery({ limit: 100 })
    const { data: warehousesData } = useWarehousesListQuery({ limit: 50, page: 1 })

    const [supplierId, setSupplierId] = useState('')
    const [warehouseId, setWarehouseId] = useState('')
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

    const warehouses = (warehousesData?.warehouses ?? []).filter((w) => w.is_active)
    useEffect(() => {
        if (warehouseId || warehouses.length === 0) return
        const def = warehouses.find((w) => w.is_default) ?? warehouses[0]
        if (def) setWarehouseId(def.id)
    }, [warehouses, warehouseId])

    const suppliers = (suppliersData?.suppliers || []).filter((s) => s.id) as { id: string; name: string }[]
    const items = linesToApiItems(draft.lines)
    const hasLines = items.length > 0
    const hasWarehouse = warehouses.length === 0 || Boolean(warehouseId)
    const canAct = hasLines && createMutation.isAllowed && hasWarehouse

    const buildBody = () => ({
        supplier_id: supplierId || undefined,
        warehouse_id: warehouseId || undefined,
        note: note || undefined,
        payment_mode: paymentMode,
        amount_paid: amountPaid,
        items,
    })

    const formatCreateError = (err: unknown) => {
        if (httpStatus(err) === 403) {
            return t('stockReceipts.messages.create_forbidden')
        }
        return getApiErrorMessage(err, t('stockReceipts.messages.draft_failed'))
    }

    const handleSaveDraft = async () => {
        setBusyAction('draft')
        try {
            await createMutation.mutateAsync(buildBody())
            navigate({ to: '/stock-receipts' })
        } catch (err: unknown) {
            toast.error(formatCreateError(err))
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
            navigate({ to: '/stock-receipts' })
        } catch (err: unknown) {
            toast.error(formatCreateError(err) || t('stockReceipts.messages.complete_failed'))
        } finally {
            setBusyAction(null)
        }
    }

    const saving = busyAction === 'draft'
    const completing = busyAction === 'complete'

    return (
        <div className="flex min-h-0 flex-col gap-3 lg:h-[calc(100vh-7rem)] lg:overflow-hidden rounded-xl border bg-background">
            {!createMutation.isAllowed && (
                <Alert variant="destructive" className="mx-4 mt-4">
                    <AlertTitle>{t('stockReceipts.messages.create_denied')}</AlertTitle>
                    <AlertDescription>{t('stockReceipts.messages.create_forbidden_hint')}</AlertDescription>
                </Alert>
            )}
            {warehouses.length === 0 && (
                <Alert className="mx-4 mt-4">
                    <AlertTitle>{t('stockReceipts.messages.no_warehouse_title')}</AlertTitle>
                    <AlertDescription>
                        {t('stockReceipts.messages.no_warehouse_body')}{' '}
                        <Link to="/warehouses" className="font-medium underline">
                            {t('sidebar.warehouses')}
                        </Link>
                    </AlertDescription>
                </Alert>
            )}
            <header className="flex shrink-0 items-center gap-2 border-b bg-muted/30 px-4 py-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/stock-receipts">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <ClipboardList className="h-5 w-5 text-primary" />
                <div className="flex-1">
                    <p className="text-sm font-semibold">{t('stockReceipts.form.create_title')}</p>
                    <p className="text-xs text-muted-foreground">{t('stockReceipts.checkout.subtitle')}</p>
                </div>
            </header>

            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
                <div className="flex min-h-[280px] min-w-0 flex-1 flex-col">
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
                            onSetQuantity={draft.setQuantity}
                            onSetUnitCost={draft.setUnitCost}
                            onSetUnitSell={draft.setUnitSell}
                            onRemove={draft.removeLine}
                        />
                    </div>
                </div>

                <div className="w-full shrink-0 border-t lg:w-[min(100%,22rem)] lg:border-t-0 xl:w-[min(24rem,100%)]">
                    <StockReceiptCheckoutPanel
                        t={t}
                        warehouses={warehouses.map((w) => ({ id: w.id, name: w.name, code: w.code }))}
                        warehouseId={warehouseId}
                        onWarehouseChange={setWarehouseId}
                        warehouseRequired={warehouses.length > 0}
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
                        needsLines={!hasLines}
                        noPermission={!createMutation.isAllowed}
                        saving={saving}
                        completing={completing}
                    />
                </div>
            </div>
        </div>
    )
}

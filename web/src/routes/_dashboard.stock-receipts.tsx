import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
    stockReceiptsListQueryOptions,
    StockReceiptsListParams,
    useCompleteStockReceiptMutation,
    useCancelStockReceiptMutation,
    useCreateStockReceiptMutation,
    useDeleteStockReceiptMutation,
    fetchStockReceiptDetails,
} from '@/lib/api/query/stockReceipts'
import { StockReceiptEditorDialog } from '@/components/stock-receipts/StockReceiptEditorDialog'
import { ListPagination } from '@/components/pagination'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Check, X, Printer, FileSpreadsheet, Trash2, Loader2 } from 'lucide-react'
import { useFormatMoney } from '@/context/MoneyContext'
import { printStockReceiptBarcodes } from '@/lib/stock-receipts/printBarcodes'
import { downloadStockReceiptsSpreadsheet } from '@/lib/stock-receipts/exportReceiptsSpreadsheet'
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

const searchSchema = z.object({
    page: z.number().catch(1),
    limit: z.number().catch(10),
    status: z.string().optional(),
})

export const Route = createFileRoute('/_dashboard/stock-receipts')({
    validateSearch: (search) => searchSchema.parse(search),
    loaderDeps: ({ search }) => search,
    loader: ({ context: { queryClient }, deps }) =>
        queryClient.ensureQueryData(stockReceiptsListQueryOptions(deps as StockReceiptsListParams)),
    component: StockReceiptsPage,
})

function StockReceiptsPage() {
    const { t } = useTranslation()
    const formatMoney = useFormatMoney()
    const navigate = useNavigate({ from: Route.fullPath })
    const searchParams = Route.useSearch() as StockReceiptsListParams
    const { data } = useSuspenseQuery(stockReceiptsListQueryOptions(searchParams))
    const { isAllowed: canCreate } = useCreateStockReceiptMutation()
    const completeMutation = useCompleteStockReceiptMutation()
    const cancelMutation = useCancelStockReceiptMutation()
    const deleteMutation = useDeleteStockReceiptMutation()

    const [editorOpen, setEditorOpen] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [bulkBusy, setBulkBusy] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

    const receipts = data.receipts || []
    const pageIds = useMemo(() => receipts.map((r) => r.id), [receipts])
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id))
    const someSelected = pageIds.some((id) => selected.has(id))

    const toggleAll = (checked: boolean) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (checked) pageIds.forEach((id) => next.add(id))
            else pageIds.forEach((id) => next.delete(id))
            return next
        })
    }

    const toggleOne = (id: string, checked: boolean) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (checked) next.add(id)
            else next.delete(id)
            return next
        })
    }

    const openReceipt = (id: string) => {
        setEditId(id)
        setEditorOpen(true)
    }

    const selectedIds = [...selected]

    const runBulk = async (fn: () => Promise<void>) => {
        if (selectedIds.length === 0) return
        setBulkBusy(true)
        try {
            await fn()
        } finally {
            setBulkBusy(false)
        }
    }

    const handlePrintBarcodes = () =>
        runBulk(async () => {
            try {
                const details = await fetchStockReceiptDetails(selectedIds)
                printStockReceiptBarcodes(details, t('stockReceipts.fields.receipt_no'))
                toast.success(t('stockReceipts.messages.print_started'))
            } catch (e) {
                if (e instanceof Error && e.message === 'NO_PRINTABLE_BARCODES') {
                    toast.error(t('stockReceipts.messages.print_no_barcodes'))
                } else if (e instanceof Error && e.message === 'POPUP_BLOCKED') {
                    toast.error(t('stockReceipts.messages.print_popup_blocked'))
                } else {
                    toast.error(t('stockReceipts.messages.print_failed'))
                }
            }
        })

    const handleExport = () =>
        runBulk(async () => {
            try {
                const details = await fetchStockReceiptDetails(selectedIds)
                downloadStockReceiptsSpreadsheet(details, 'stock_receipts_export.csv')
                toast.success(t('stockReceipts.messages.export_success'))
            } catch {
                toast.error(t('stockReceipts.messages.export_failed'))
            }
        })

    const handleConfirmDelete = () =>
        runBulk(async () => {
            const deletable = receipts.filter(
                (r) => selected.has(r.id) && (r.status === 'draft' || r.status === 'cancelled'),
            )
            if (deletable.length === 0) {
                toast.error(t('stockReceipts.messages.delete_none'))
                setDeleteConfirmOpen(false)
                return
            }
            for (const r of deletable) {
                await deleteMutation.mutateAsync(r.id)
            }
            setSelected(new Set())
            setDeleteConfirmOpen(false)
        })

    const selectedCount = selectedIds.length
    const canDeleteSelection =
        deleteMutation.isAllowed &&
        receipts.some((r) => selected.has(r.id) && (r.status === 'draft' || r.status === 'cancelled'))

    return (
        <div className="space-y-4 p-4">
            <Card>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
                    <CardTitle>{t('stockReceipts.title')}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                        {selectedCount > 0 && (
                            <>
                                <span className="text-sm text-muted-foreground">
                                    {t('stockReceipts.bulk.selected', { count: selectedCount })}
                                </span>
                                <Button variant="outline" size="sm" disabled={bulkBusy} onClick={handlePrintBarcodes}>
                                    {bulkBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                                    {t('stockReceipts.bulk.print_barcodes')}
                                </Button>
                                <Button variant="outline" size="sm" disabled={bulkBusy} onClick={handleExport}>
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    {t('stockReceipts.bulk.export_excel')}
                                </Button>
                                {canDeleteSelection && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        disabled={bulkBusy}
                                        onClick={() => setDeleteConfirmOpen(true)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        {t('stockReceipts.bulk.delete')}
                                    </Button>
                                )}
                            </>
                        )}
                        {canCreate && (
                            <Button asChild>
                                <Link to="/stock-receipts/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t('stockReceipts.actions.add')}
                                </Link>
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10">
                                    <Checkbox
                                        checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                                        onCheckedChange={(v) => toggleAll(v === true)}
                                        aria-label={t('stockReceipts.bulk.select_all')}
                                    />
                                </TableHead>
                                <TableHead>{t('stockReceipts.fields.receipt_no')}</TableHead>
                                <TableHead>{t('stockReceipts.fields.supplier')}</TableHead>
                                <TableHead>{t('stockReceipts.fields.status')}</TableHead>
                                <TableHead className="text-right">{t('stockReceipts.fields.total')}</TableHead>
                                <TableHead className="text-right w-28">{t('common.actions', 'Actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {receipts.map((r) => (
                                <TableRow
                                    key={r.id}
                                    className="cursor-pointer"
                                    onClick={() => openReceipt(r.id)}
                                >
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={selected.has(r.id)}
                                            onCheckedChange={(v) => toggleOne(r.id, v === true)}
                                            aria-label={t('stockReceipts.bulk.select_row')}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{r.receipt_no}</TableCell>
                                    <TableCell>{r.supplier_name || '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant={r.status === 'completed' ? 'default' : 'secondary'}>
                                            {t(`stockReceipts.status.${r.status}`, r.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{formatMoney(r.total_amount)}</TableCell>
                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                        {r.status === 'draft' && (
                                            <div className="inline-flex gap-1">
                                                {completeMutation.isAllowed && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title={t('stockReceipts.actions.complete')}
                                                        onClick={() => completeMutation.mutate(r.id)}
                                                    >
                                                        <Check className="h-4 w-4 text-green-600" />
                                                    </Button>
                                                )}
                                                {cancelMutation.isAllowed && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title={t('stockReceipts.status.cancelled')}
                                                        onClick={() => cancelMutation.mutate(r.id)}
                                                    >
                                                        <X className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <ListPagination
                        pagination={data.pagination}
                        onPageChange={(page) => {
                            setSelected(new Set())
                            navigate({ search: (prev) => ({ ...prev, page }) })
                        }}
                        onLimitChange={(limit) => {
                            setSelected(new Set())
                            navigate({ search: (prev) => ({ ...prev, limit, page: 1 }) })
                        }}
                    />
                    <Button variant="link" asChild className="px-0">
                        <Link to="/inventory" search={{}}>
                            {t('inventory.link_from_receipts')}
                        </Link>
                    </Button>
                </CardContent>
            </Card>
            <StockReceiptEditorDialog
                open={editorOpen}
                onOpenChange={(open) => {
                    setEditorOpen(open)
                    if (!open) setEditId(null)
                }}
                receiptId={editId}
            />
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('stockReceipts.bulk.delete_confirm_title')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('stockReceipts.bulk.delete_confirm_body')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete}>{t('stockReceipts.bulk.delete')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

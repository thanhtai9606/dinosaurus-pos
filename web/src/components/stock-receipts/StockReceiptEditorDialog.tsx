import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    StockReceiptItem,
    useCreateStockReceiptMutation,
    useUpdateStockReceiptMutation,
    useStockReceiptDetailQuery,
} from '@/lib/api/query/stockReceipts'
import { useSuppliersListQuery } from '@/lib/api/query/suppliers'
import { useProductsListQuery } from '@/lib/api/query/products'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Plus, Trash2 } from 'lucide-react'

type LineDraft = { product_id: string; quantity: number; unit_cost: number; product_name?: string }

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
    const createMutation = useCreateStockReceiptMutation()
    const updateMutation = useUpdateStockReceiptMutation()
    const { data: detail } = useStockReceiptDetailQuery(receiptId || '')
    const { data: suppliersData } = useSuppliersListQuery({ limit: 100 })
    const { data: productsData } = useProductsListQuery({ limit: 100 })

    const [supplierId, setSupplierId] = useState<string>('')
    const [note, setNote] = useState('')
    const [lines, setLines] = useState<LineDraft[]>([{ product_id: '', quantity: 1, unit_cost: 0 }])

    useEffect(() => {
        if (!open) return
        if (receiptId && detail) {
            setSupplierId(detail.supplier_id || '')
            setNote(detail.note || '')
            setLines(
                (detail.items || []).map((it) => ({
                    product_id: it.product_id,
                    quantity: it.quantity,
                    unit_cost: it.unit_cost,
                    product_name: it.product_name,
                }))
            )
        } else if (!receiptId) {
            setSupplierId('')
            setNote('')
            setLines([{ product_id: '', quantity: 1, unit_cost: 0 }])
        }
    }, [open, receiptId, detail])

    const products = productsData?.products || []
    const suppliers = suppliersData?.suppliers || []
    const pending = createMutation.isPending || updateMutation.isPending

    const buildItems = (): StockReceiptItem[] =>
        lines
            .filter((l) => l.product_id && l.quantity > 0)
            .map((l) => ({ product_id: l.product_id, quantity: l.quantity, unit_cost: l.unit_cost }))

    const handleSave = async () => {
        const items = buildItems()
        const body = {
            supplier_id: supplierId || undefined,
            note: note || undefined,
            items,
        }
        if (receiptId) {
            await updateMutation.mutateAsync({ id: receiptId, body })
        } else {
            await createMutation.mutateAsync(body)
        }
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {receiptId ? t('stockReceipts.form.edit_title') : t('stockReceipts.form.create_title')}
                    </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">{t('stockReceipts.form.cost_note')}</p>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label>{t('stockReceipts.fields.supplier')}</Label>
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
                    </div>
                    <div>
                        <Label>{t('stockReceipts.fields.note')}</Label>
                        <Input value={note} onChange={(e) => setNote(e.target.value)} />
                    </div>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('stockReceipts.fields.product')}</TableHead>
                            <TableHead>{t('stockReceipts.fields.quantity')}</TableHead>
                            <TableHead>{t('stockReceipts.fields.unit_cost')}</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lines.map((line, idx) => (
                            <TableRow key={idx}>
                                <TableCell>
                                    <Select
                                        value={line.product_id}
                                        onValueChange={(v) => {
                                            const next = [...lines]
                                            next[idx].product_id = v
                                            setLines(next)
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('stockReceipts.fields.product')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map((p: { id?: string; name?: string }) => (
                                                <SelectItem key={p.id} value={p.id!}>
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={line.quantity}
                                        onChange={(e) => {
                                            const next = [...lines]
                                            next[idx].quantity = Number(e.target.value)
                                            setLines(next)
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={line.unit_cost}
                                        onChange={(e) => {
                                            const next = [...lines]
                                            next[idx].unit_cost = Number(e.target.value)
                                            setLines(next)
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLines([...lines, { product_id: '', quantity: 1, unit_cost: 0 }])}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('stockReceipts.actions.add_line')}
                </Button>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={pending || buildItems().length === 0}>
                        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('common.save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

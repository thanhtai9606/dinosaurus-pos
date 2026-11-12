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
import { useFormatMoney } from '@/context/MoneyContext'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Plus, Trash2 } from 'lucide-react'

type LineDraft = {
    product_id: string
    quantity: number
    unit_cost: number
    unit_sell_price?: number
}

type ProductRow = {
    id?: string
    name?: string
    cost_price?: number
    price?: number
    sku?: string | null
}

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
    const createMutation = useCreateStockReceiptMutation()
    const updateMutation = useUpdateStockReceiptMutation()
    const { data: detail } = useStockReceiptDetailQuery(receiptId || '')
    const { data: suppliersData } = useSuppliersListQuery({ limit: 100 })
    const { data: productsData } = useProductsListQuery({ limit: 200 })

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
                    unit_sell_price: it.unit_sell_price,
                }))
            )
        } else if (!receiptId) {
            setSupplierId('')
            setNote('')
            setLines([{ product_id: '', quantity: 1, unit_cost: 0 }])
        }
    }, [open, receiptId, detail])

    const products = (productsData?.products || []) as ProductRow[]
    const suppliers = suppliersData?.suppliers || []
    const pending = createMutation.isPending || updateMutation.isPending

    const productMap = Object.fromEntries(products.filter((p) => p.id).map((p) => [p.id!, p]))

    const buildItems = (): StockReceiptItem[] =>
        lines
            .filter((l) => l.product_id && l.quantity > 0)
            .map((l) => ({
                product_id: l.product_id,
                quantity: l.quantity,
                unit_cost: l.unit_cost,
                unit_sell_price: l.unit_sell_price !== undefined && l.unit_sell_price > 0 ? l.unit_sell_price : undefined,
            }))

    const pickProduct = (idx: number, productId: string) => {
        const next = [...lines]
        next[idx].product_id = productId
        const p = productMap[productId]
        if (p) {
            if (p.cost_price != null) next[idx].unit_cost = Number(p.cost_price)
            if (p.price != null) next[idx].unit_sell_price = Number(p.price)
        }
        setLines(next)
    }

    const handleSave = async () => {
        const items = buildItems()
        const body = { supplier_id: supplierId || undefined, note: note || undefined, items }
        if (receiptId) {
            await updateMutation.mutateAsync({ id: receiptId, body })
        } else {
            await createMutation.mutateAsync(body)
        }
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {receiptId ? t('stockReceipts.form.edit_title') : t('stockReceipts.form.create_title')}
                    </DialogTitle>
                    <DialogDescription className="space-y-1 text-left">
                        <p>{t('stockReceipts.form.cost_note')}</p>
                        <p>{t('stockReceipts.form.sell_note')}</p>
                    </DialogDescription>
                </DialogHeader>
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
                            <TableHead className="w-24">{t('stockReceipts.fields.quantity')}</TableHead>
                            <TableHead title={t('stockReceipts.fields.unit_cost_hint')}>{t('stockReceipts.fields.unit_cost')}</TableHead>
                            <TableHead title={t('stockReceipts.fields.unit_sell_hint')}>{t('stockReceipts.fields.unit_sell_price')}</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lines.map((line, idx) => {
                            const current = line.product_id ? productMap[line.product_id] : undefined
                            return (
                                <TableRow key={idx}>
                                    <TableCell className="space-y-1">
                                        <Select value={line.product_id} onValueChange={(v) => pickProduct(idx, v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('stockReceipts.fields.product')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map((p) => (
                                                    <SelectItem key={p.id} value={p.id!}>
                                                        {p.sku ? `${p.sku} — ` : ''}
                                                        {p.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {current && (
                                            <p className="text-xs text-muted-foreground">
                                                {t('stockReceipts.fields.current_prices', {
                                                    cost: formatMoney(current.cost_price ?? 0),
                                                    sell: formatMoney(current.price ?? 0),
                                                })}
                                            </p>
                                        )}
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
                                        <Input
                                            type="number"
                                            min={0}
                                            step="1"
                                            placeholder={t('stockReceipts.fields.optional')}
                                            value={line.unit_sell_price ?? ''}
                                            onChange={(e) => {
                                                const next = [...lines]
                                                const v = e.target.value
                                                next[idx].unit_sell_price = v === '' ? undefined : Number(v)
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
                            )
                        })}
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

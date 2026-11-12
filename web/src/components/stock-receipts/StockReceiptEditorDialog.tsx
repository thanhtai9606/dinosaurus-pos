import { useEffect, useMemo, useState } from 'react'
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
import { Badge } from '@/components/ui/badge'

type LineDraft = {
    product_id: string
    quantity: number
    unit_cost: number
    unit_sell_price?: number
    product_name?: string
    product_sku?: string | null
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
    const { data: detail, isFetching } = useStockReceiptDetailQuery(receiptId || '')
    const { data: suppliersData } = useSuppliersListQuery({ limit: 100 })
    const { data: productsData } = useProductsListQuery({ limit: 500 })

    const readOnly = Boolean(receiptId && detail && detail.status !== 'draft')

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
                    product_name: it.product_name,
                    product_sku: it.product_sku,
                })),
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

    const productMap = useMemo(
        () => Object.fromEntries(products.filter((p) => p.id).map((p) => [p.id!, p])),
        [products],
    )

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

    const title = receiptId
        ? readOnly
            ? t('stockReceipts.form.view_title')
            : t('stockReceipts.form.edit_title')
        : t('stockReceipts.form.create_title')

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex w-[min(96rem,calc(100vw-2rem))] max-h-[92vh] flex-col gap-4 overflow-y-auto sm:max-w-7xl">
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
                    {!readOnly && (
                        <DialogDescription className="space-y-1 text-left">
                            <p>{t('stockReceipts.form.cost_note')}</p>
                            <p>{t('stockReceipts.form.sell_note')}</p>
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
                        <div className="overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[220px]">{t('stockReceipts.fields.product')}</TableHead>
                                        <TableHead className="w-28">{t('stockReceipts.fields.quantity')}</TableHead>
                                        <TableHead className="w-36" title={t('stockReceipts.fields.unit_cost_hint')}>
                                            {t('stockReceipts.fields.unit_cost')}
                                        </TableHead>
                                        <TableHead className="w-36" title={t('stockReceipts.fields.unit_sell_hint')}>
                                            {t('stockReceipts.fields.unit_sell_price')}
                                        </TableHead>
                                        {!readOnly && <TableHead className="w-12" />}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lines.map((line, idx) => {
                                        const current = line.product_id ? productMap[line.product_id] : undefined
                                        const label =
                                            line.product_name ||
                                            (current?.sku ? `${current.sku} — ${current.name}` : current?.name) ||
                                            '—'
                                        return (
                                            <TableRow key={idx}>
                                                <TableCell className="space-y-1">
                                                    {readOnly ? (
                                                        <span className="text-sm font-medium">{label}</span>
                                                    ) : (
                                                        <>
                                                            <Select value={line.product_id} onValueChange={(v) => pickProduct(idx, v)}>
                                                                <SelectTrigger className="w-full min-w-[200px]">
                                                                    <SelectValue placeholder={t('stockReceipts.fields.product')} />
                                                                </SelectTrigger>
                                                                <SelectContent className="max-h-72">
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
                                                        </>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {readOnly ? (
                                                        line.quantity
                                                    ) : (
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
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {readOnly ? (
                                                        formatMoney(line.unit_cost)
                                                    ) : (
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
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {readOnly ? (
                                                        line.unit_sell_price != null && line.unit_sell_price > 0
                                                            ? formatMoney(line.unit_sell_price)
                                                            : '—'
                                                    ) : (
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
                                                    )}
                                                </TableCell>
                                                {!readOnly && (
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        {!readOnly && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="self-start"
                                onClick={() => setLines([...lines, { product_id: '', quantity: 1, unit_cost: 0 }])}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                {t('stockReceipts.actions.add_line')}
                            </Button>
                        )}
                        {!readOnly && (
                            <DialogFooter>
                                <Button onClick={handleSave} disabled={pending || buildItems().length === 0}>
                                    {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t('common.save')}
                                </Button>
                            </DialogFooter>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}

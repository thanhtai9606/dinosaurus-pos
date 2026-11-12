import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useFormatMoney } from '@/context/MoneyContext'
import type { StockReceiptLine } from '@/lib/stock-receipts/receiptLines'
import { stockReceiptLineKey } from '@/lib/stock-receipts/receiptLines'

type Props = {
    lines: StockReceiptLine[]
    readOnly: boolean
    t: (key: string, fallback?: string) => string
    onUpdateQuantity: (productId: string, delta: number) => void
    onSetUnitCost: (productId: string, value: number) => void
    onSetUnitSell: (productId: string, value: number | undefined) => void
    onRemove: (productId: string) => void
}

export function StockReceiptLineItemsTable({
    lines,
    readOnly,
    t,
    onUpdateQuantity,
    onSetUnitCost,
    onSetUnitSell,
    onRemove,
}: Props) {
    const formatMoney = useFormatMoney()

    return (
        <ScrollArea className="max-h-[min(50vh,420px)] rounded-md border">
            <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                    <TableRow>
                        <TableHead className="w-12 text-center">#</TableHead>
                        <TableHead className="w-32">{t('retailPos.table.barcode')}</TableHead>
                        <TableHead>{t('stockReceipts.fields.product')}</TableHead>
                        <TableHead className="w-36 text-center">{t('stockReceipts.fields.quantity')}</TableHead>
                        <TableHead className="w-32" title={t('stockReceipts.fields.unit_cost_hint')}>
                            {t('stockReceipts.fields.unit_cost')}
                        </TableHead>
                        <TableHead className="w-32" title={t('stockReceipts.fields.unit_sell_hint')}>
                            {t('stockReceipts.fields.unit_sell_price')}
                        </TableHead>
                        <TableHead className="w-28 text-right">{t('stockReceipts.fields.line_total')}</TableHead>
                        {!readOnly && <TableHead className="w-12" />}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {lines.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={readOnly ? 7 : 8} className="h-28 text-center text-muted-foreground">
                                {t('stockReceipts.form.empty_lines')}
                            </TableCell>
                        </TableRow>
                    ) : (
                        lines.map((line, index) => {
                            const id = line.product.id!
                            const key = stockReceiptLineKey(id)
                            const code = line.product.barcode || line.product.sku || '—'
                            const lineTotal = line.quantity * line.unit_cost
                            return (
                                <TableRow key={key}>
                                    <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                                    <TableCell className="font-mono text-xs">{code}</TableCell>
                                    <TableCell className="font-medium">{line.product.name}</TableCell>
                                    <TableCell>
                                        {readOnly ? (
                                            <span className="block text-center font-semibold">{line.quantity}</span>
                                        ) : (
                                            <div className="flex items-center justify-center gap-1">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => onUpdateQuantity(id, -1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-8 text-center font-semibold">{line.quantity}</span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => onUpdateQuantity(id, 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
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
                                                className="h-8"
                                                value={line.unit_cost}
                                                onChange={(e) => onSetUnitCost(id, Number(e.target.value))}
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
                                                className="h-8"
                                                placeholder={t('stockReceipts.fields.optional')}
                                                value={line.unit_sell_price ?? ''}
                                                onChange={(e) => {
                                                    const v = e.target.value
                                                    onSetUnitSell(id, v === '' ? undefined : Number(v))
                                                }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">{formatMoney(lineTotal)}</TableCell>
                                    {!readOnly && (
                                        <TableCell>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            )
                        })
                    )}
                </TableBody>
            </Table>
        </ScrollArea>
    )
}

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QuantityEditor } from '@/components/common/QuantityEditor'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFormatMoney } from '@/context/MoneyContext'
import type { StockReceiptLine } from '@/lib/stock-receipts/receiptLines'
import { stockReceiptLineKey } from '@/lib/stock-receipts/receiptLines'
import { saleUnitsOf } from '@/lib/retail-pos/productUnits'

type Props = {
    lines: StockReceiptLine[]
    readOnly: boolean
    t: (key: string, fallback?: string) => string
    onUpdateQuantity: (lineKey: string, delta: number) => void
    onSetQuantity: (lineKey: string, quantity: number) => void
    onChangeSaleUnit: (lineKey: string, unit: StockReceiptLine['saleUnit']) => void
    onSetUnitCost: (lineKey: string, value: number) => void
    onSetUnitSell: (lineKey: string, value: number | undefined) => void
    onRemove: (lineKey: string) => void
}

export function StockReceiptLineItemsTable({
    lines,
    readOnly,
    t,
    onUpdateQuantity,
    onSetQuantity,
    onChangeSaleUnit,
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
                        <TableHead className="w-28">{t('retailPos.table.unit')}</TableHead>
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
                            <TableCell colSpan={readOnly ? 8 : 9} className="h-28 text-center text-muted-foreground">
                                {t('stockReceipts.form.empty_lines')}
                            </TableCell>
                        </TableRow>
                    ) : (
                        lines.map((line, index) => {
                            const lineKey = stockReceiptLineKey(line.product.id!, line.saleUnit)
                            const code = line.saleUnit.barcode || line.product.barcode || line.product.sku || '—'
                            const units = saleUnitsOf(line.product)
                            const lineTotal = line.quantity * line.unit_cost
                            return (
                                <TableRow key={lineKey}>
                                    <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                                    <TableCell className="font-mono text-xs">{code}</TableCell>
                                    <TableCell className="font-medium">{line.product.name}</TableCell>
                                    <TableCell>
                                        {readOnly ? (
                                            line.saleUnit.name
                                        ) : units.length > 1 ? (
                                            <Select
                                                value={line.saleUnit.id ?? line.saleUnit.name}
                                                onValueChange={(v) => {
                                                    const next = units.find((u) => (u.id ?? u.name) === v)
                                                    if (next) onChangeSaleUnit(lineKey, next)
                                                }}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {units.map((u) => (
                                                        <SelectItem key={u.id ?? u.name} value={u.id ?? u.name}>
                                                            {u.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            line.saleUnit.name
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {readOnly ? (
                                            <span className="block text-center font-semibold">{line.quantity}</span>
                                        ) : (
                                            <QuantityEditor
                                                value={line.quantity}
                                                onDelta={(d) => onUpdateQuantity(lineKey, d)}
                                                onSetValue={(q) => onSetQuantity(lineKey, q)}
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
                                                className="h-8"
                                                value={line.unit_cost}
                                                onChange={(e) => onSetUnitCost(lineKey, Number(e.target.value))}
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
                                                    onSetUnitSell(lineKey, v === '' ? undefined : Number(e.target.value))
                                                }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">{formatMoney(lineTotal)}</TableCell>
                                    {!readOnly && (
                                        <TableCell>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(lineKey)}>
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
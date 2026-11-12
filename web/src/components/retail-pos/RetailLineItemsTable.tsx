import { Minus, Plus, StickyNote, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFormatMoney } from '@/context/MoneyContext'
import { CartItem } from '@/components/orders/CartContent'
import { catalogUnitPrice, lineSubtotal, lineUnitPrice } from '@/lib/retail-pos/pricing'
import { cartLineKey, defaultSaleUnit, saleUnitsOf, type ProductSaleUnit } from '@/lib/retail-pos/productUnits'
import { cn } from '@/lib/utils'

type Props = {
    cart: CartItem[]
    t: (key: string, fallback?: string) => string
    onUpdateQuantity: (lineKey: string, delta: number) => void
    onRemove: (lineKey: string) => void
    onEditPrice: (item: CartItem) => void
    onChangeSaleUnit: (lineKey: string, unit: ProductSaleUnit) => void
}

export function RetailLineItemsTable({ cart, t, onUpdateQuantity, onRemove, onEditPrice, onChangeSaleUnit }: Props) {
    const formatMoney = useFormatMoney()

    return (
        <ScrollArea className="h-full">
            <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                        <TableHead className="w-12 text-center">#</TableHead>
                        <TableHead>{t('retailPos.table.barcode')}</TableHead>
                        <TableHead>{t('retailPos.table.name')}</TableHead>
                        <TableHead className="w-32">{t('retailPos.table.unit')}</TableHead>
                        <TableHead className="w-36 text-center">{t('retailPos.table.quantity')}</TableHead>
                        <TableHead className="w-32 text-right">{t('retailPos.table.price')}</TableHead>
                        <TableHead className="w-36 text-right">{t('retailPos.table.subtotal')}</TableHead>
                        <TableHead className="w-12" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cart.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                                {t('retailPos.empty_cart')}
                            </TableCell>
                        </TableRow>
                    ) : (
                        cart.map((item, index) => {
                            const vid = item.variant?.id
                            const saleUnit = item.saleUnit ?? defaultSaleUnit(item.product)
                            const lineKey = cartLineKey(item.product.id!, vid, saleUnit)
                            const units = saleUnitsOf(item.product)
                            const unitLabel = saleUnit.barcode || item.product.barcode || item.product.sku || '—'
                            return (
                                <TableRow key={lineKey}>
                                    <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                                    <TableCell className="font-mono text-xs">{unitLabel}</TableCell>
                                    <TableCell className="font-medium">
                                        {item.product.name}
                                        {item.variant?.name ? (
                                            <span className="text-muted-foreground text-xs block">{item.variant.name}</span>
                                        ) : null}
                                    </TableCell>
                                    <TableCell>
                                        {units.length > 1 ? (
                                            <Select
                                                value={saleUnit.id ?? saleUnit.name}
                                                onValueChange={(v) => {
                                                    const next = units.find((u) => (u.id ?? u.name) === v)
                                                    if (next) onChangeSaleUnit(lineKey, next)
                                                }}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {units.map((u) => (
                                                        <SelectItem key={u.id ?? u.name} value={u.id ?? u.name}>
                                                            {u.name}
                                                            {!u.is_base && u.factor_to_base > 1 ? ` (×${u.factor_to_base})` : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            saleUnit.name
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => onUpdateQuantity(lineKey, -1)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => onUpdateQuantity(lineKey, 1)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <button
                                            type="button"
                                            className={cn(
                                                'rounded px-1.5 py-0.5 hover:bg-primary/10 underline-offset-2 hover:underline',
                                                item.unitPrice != null && item.unitPrice !== catalogUnitPrice(item) && 'text-amber-700 dark:text-amber-400',
                                            )}
                                            title={t('retailPos.table.edit_price')}
                                            onClick={() => onEditPrice(item)}
                                        >
                                            {formatMoney(lineUnitPrice(item))}
                                        </button>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">{formatMoney(lineSubtotal(item))}</TableCell>
                                    <TableCell>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive"
                                            onClick={() => onRemove(lineKey)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    )}
                </TableBody>
            </Table>
            {cart.length > 0 && (
                <div className="flex items-center gap-2 border-t px-4 py-2 text-xs text-muted-foreground">
                    <StickyNote className="h-3.5 w-3.5" />
                    {t('retailPos.table.hint')}
                </div>
            )}
        </ScrollArea>
    )
}

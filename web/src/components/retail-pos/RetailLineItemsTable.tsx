import { Minus, Plus, StickyNote, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useFormatMoney } from '@/context/MoneyContext'
import { CartItem } from '@/components/orders/CartContent'

type Props = {
    cart: CartItem[]
    t: (key: string, fallback?: string) => string
    onUpdateQuantity: (productId: string, delta: number, variantId?: string) => void
    onRemove: (productId: string, variantId?: string) => void
}

export function RetailLineItemsTable({ cart, t, onUpdateQuantity, onRemove }: Props) {
    const formatMoney = useFormatMoney()

    const linePrice = (item: CartItem) => (item.product.price || 0) + (item.variant?.additional_price || 0)
    const lineTotal = (item: CartItem) => linePrice(item) * item.quantity

    return (
        <ScrollArea className="h-full">
            <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                        <TableHead className="w-12 text-center">#</TableHead>
                        <TableHead>{t('retailPos.table.barcode')}</TableHead>
                        <TableHead>{t('retailPos.table.name')}</TableHead>
                        <TableHead className="w-24">{t('retailPos.table.unit')}</TableHead>
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
                            const key = `${item.product.id}-${vid ?? 'base'}`
                            return (
                                <TableRow key={key}>
                                    <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                                    <TableCell className="font-mono text-xs">{item.product.barcode || item.product.sku || '—'}</TableCell>
                                    <TableCell className="font-medium">
                                        {item.product.name}
                                        {item.variant?.name ? (
                                            <span className="text-muted-foreground text-xs block">{item.variant.name}</span>
                                        ) : null}
                                    </TableCell>
                                    <TableCell>{item.product.unit || 'pcs'}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => onUpdateQuantity(item.product.id!, -1, vid)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => onUpdateQuantity(item.product.id!, 1, vid)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">{formatMoney(linePrice(item))}</TableCell>
                                    <TableCell className="text-right font-semibold">{formatMoney(lineTotal(item))}</TableCell>
                                    <TableCell>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive"
                                            onClick={() => onRemove(item.product.id!, vid)}
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

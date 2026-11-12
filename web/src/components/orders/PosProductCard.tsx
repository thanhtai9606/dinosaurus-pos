import { Plus, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Product } from '@/lib/api/query/products'
import { cn } from '@/lib/utils'
import { useFormatMoney } from '@/context/MoneyContext'

interface PosProductCardProps {
    product: Product
    onAdd: () => void
    disabled?: boolean
    addLabel: string
    outOfStockLabel: string
}

export function PosProductCard({
    product,
    onAdd,
    disabled,
    addLabel,
    outOfStockLabel,
}: PosProductCardProps) {
    const formatMoney = useFormatMoney()
    const inStock = (product.stock ?? 0) > 0
    const categoryName = product.categories?.map((c) => c.name).filter(Boolean).join(', ')

    return (
        <Card
            className={cn(
                'overflow-hidden transition-shadow hover:shadow-md',
                !inStock && 'opacity-60',
                inStock && !disabled && 'cursor-pointer'
            )}
        >
            <CardContent className="p-3 sm:p-4">
                <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-muted">
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/60">
                            <span className="text-3xl font-bold text-muted-foreground/50">
                                {(product.name || '?').charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    {!inStock && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/45">
                            <span className="text-xs font-semibold text-white">{outOfStockLabel}</span>
                        </div>
                    )}
                    {inStock && product.stock !== undefined && product.stock <= 5 && (
                        <Badge className="absolute left-2 top-2 text-[10px] h-5" variant="secondary">
                            {product.stock}
                        </Badge>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="min-h-[2.5rem]">
                        <h3 className="line-clamp-2 text-sm font-semibold leading-tight">{product.name}</h3>
                        {categoryName && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{categoryName}</p>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <span className="text-base font-bold">{formatMoney(product.price || 0)}</span>
                        {!product.image_url && <Package className="h-4 w-4 text-muted-foreground/40 hidden sm:block" />}
                    </div>

                    <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        disabled={!inStock || disabled}
                        onClick={(e) => {
                            e.stopPropagation()
                            onAdd()
                        }}
                    >
                        <Plus className="mr-1 h-4 w-4" />
                        {addLabel}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

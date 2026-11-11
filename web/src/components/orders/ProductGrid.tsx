import { Package, Loader2 } from 'lucide-react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Product } from '@/lib/api/query/products'
import { PosProductCard } from './PosProductCard'

interface ProductGridProps {
    inStockProducts: Product[]
    outOfStockProducts: Product[]
    isLoading?: boolean
    isLoadingDetailsId: string | null
    onAddToCart: (product: Product) => void
    t: (key: string, opts?: Record<string, unknown>) => string
}

function ProductGridSkeleton() {
    return (
        <div className="grid grid-cols-2 gap-3 p-4 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                    <CardContent className="p-4">
                        <div className="mb-3 aspect-square animate-pulse rounded-lg bg-muted" />
                        <div className="space-y-2">
                            <div className="h-4 animate-pulse rounded bg-muted" />
                            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                            <div className="h-9 animate-pulse rounded bg-muted" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

export function ProductGrid({
    inStockProducts,
    outOfStockProducts,
    isLoading,
    isLoadingDetailsId,
    onAddToCart,
    t,
}: ProductGridProps) {
    const gridClass =
        'grid grid-cols-2 gap-3 p-4 pb-6 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'

    if (isLoading) {
        return (
            <ScrollArea className="h-full">
                <ProductGridSkeleton />
                <ScrollBar orientation="vertical" />
            </ScrollArea>
        )
    }

    const total = inStockProducts.length + outOfStockProducts.length
    if (total === 0) {
        return (
            <div className="flex h-full flex-1 items-center justify-center p-8">
                <div className="text-center">
                    <Package className="mx-auto mb-4 h-14 w-14 text-muted-foreground/30" />
                    <h3 className="text-lg font-medium">{t('order.no_products')}</h3>
                </div>
            </div>
        )
    }

    return (
        <ScrollArea className="h-full">
            <div className={gridClass}>
                {inStockProducts.map((product) => (
                    <div key={product.id} className="relative">
                        <PosProductCard
                            product={product}
                            onAdd={() => onAddToCart(product)}
                            disabled={isLoadingDetailsId === product.id}
                            addLabel={t('order.add_to_cart')}
                            outOfStockLabel={t('order.out_of_stock')}
                        />
                        {isLoadingDetailsId === product.id && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-[1px]">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {outOfStockProducts.length > 0 && (
                <>
                    <div className="relative px-4 py-3">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-wide">
                            <span className="bg-background px-2 text-muted-foreground">
                                {t('order.out_of_stock')}
                            </span>
                        </div>
                    </div>
                    <div className={cnGridMuted(gridClass)}>
                        {outOfStockProducts.map((product) => (
                            <PosProductCard
                                key={product.id}
                                product={product}
                                onAdd={() => {}}
                                disabled
                                addLabel={t('order.add_to_cart')}
                                outOfStockLabel={t('order.out_of_stock')}
                            />
                        ))}
                    </div>
                </>
            )}
            <ScrollBar orientation="vertical" />
        </ScrollArea>
    )
}

function cnGridMuted(base: string) {
    return `${base} opacity-55 grayscale`
}

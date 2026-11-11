import { useMemo } from 'react'
import { DollarSign, Image, Package, Tag, Boxes, Settings2 } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProductActions } from './ProductActions'
import { formatRupiah } from '@/lib/utils'
import { TableColumnHeader } from '@/components/data-table/TableColumnHeader'
import { useClientSort } from '@/hooks/use-client-sort'

interface ProductTableProps {
    products: any[]
    emptyMessage: string
    isTrash?: boolean
    canRestore?: boolean
    onRestore?: (product: any) => void
    onEdit?: (product: any) => void
    t: any
    hasActions?: boolean
}

export function ProductTable({
    products, emptyMessage, isTrash, canRestore, onRestore, onEdit, t, hasActions = true
}: ProductTableProps) {
    const getters = useMemo(
        () => ({
            name: (p: any) => p.name ?? '',
            price: (p: any) => p.price ?? 0,
            stock: (p: any) => p.stock ?? 0,
        }),
        []
    )
    const { sorted, toggleSort, getSortDirection } = useClientSort(products, getters)

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px] hidden sm:table-cell">
                            <TableColumnHeader title={t('products.table.image')} icon={Image} />
                        </TableHead>
                        <TableHead>
                            <TableColumnHeader
                                title={t('products.table.name')}
                                icon={Package}
                                sort={getSortDirection('name')}
                                onSort={() => toggleSort('name')}
                            />
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                            <TableColumnHeader title={t('products.table.category')} icon={Tag} />
                        </TableHead>
                        <TableHead>
                            <TableColumnHeader
                                title={t('products.table.price')}
                                icon={DollarSign}
                                sort={getSortDirection('price')}
                                onSort={() => toggleSort('price')}
                            />
                        </TableHead>
                        <TableHead>
                            <TableColumnHeader
                                title={t('products.table.stock')}
                                icon={Boxes}
                                sort={getSortDirection('stock')}
                                onSort={() => toggleSort('stock')}
                            />
                        </TableHead>
                        <TableHead className="text-right">
                            <TableColumnHeader
                                title={t('products.table.actions')}
                                icon={Settings2}
                                align="right"
                            />
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sorted.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                <div className="flex flex-col items-center gap-2">
                                    <Package className="h-8 w-8 opacity-40" />
                                    <span>{emptyMessage}</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        sorted.map((product: any) => (
                            <TableRow key={product.id} className={isTrash ? 'opacity-70 bg-muted/30' : ''}>
                                <TableCell className="hidden sm:table-cell">
                                    <Avatar className={`h-10 w-10 rounded-md border ${isTrash ? 'grayscale' : ''}`}>
                                        <AvatarImage
                                            src={product.image_url}
                                            alt={product.name}
                                            className="object-cover"
                                        />
                                        <AvatarFallback className="rounded-md">
                                            <Package className="h-5 w-5 text-muted-foreground" />
                                        </AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell className={`font-medium ${isTrash ? 'text-muted-foreground' : ''}`}>
                                    {product.name}
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    <div className="flex flex-wrap gap-1">
                                        {product.categories?.map((cat: any) => (
                                            <Badge
                                                key={cat.id}
                                                variant="outline"
                                                className={`text-sm ${isTrash ? 'opacity-50' : ''}`}
                                            >
                                                {cat.name}
                                            </Badge>
                                        )) || '-'}
                                    </div>
                                </TableCell>
                                <TableCell className={isTrash ? 'text-muted-foreground' : ''}>
                                    {formatRupiah(product.price || 0)}
                                </TableCell>
                                <TableCell>
                                    {isTrash ? (
                                        <span className="text-muted-foreground">{product.stock}</span>
                                    ) : (
                                        <Badge
                                            variant={
                                                product.stock && product.stock > 0 ? 'secondary' : 'destructive'
                                            }
                                        >
                                            {product.stock}
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {isTrash ? (
                                        canRestore && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onRestore?.(product)}
                                            >
                                                {t('products.actions.restore')}
                                            </Button>
                                        )
                                    ) : (
                                        hasActions ? (
                                            <ProductActions product={product} onEdit={() => onEdit?.(product)} />
                                        ) : null
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

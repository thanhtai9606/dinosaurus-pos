import { useMemo } from 'react'
import { DollarSign, Image, Package, Settings2, Tag, Boxes } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { Product } from '@/lib/api/query/products'
import { DataGrid, type DataGridColumnDef } from '@/components/data-table'
import { ProductActions } from './ProductActions'
import { useFormatMoney } from '@/context/MoneyContext'
import type { POSKasirInternalCommonPaginationPagination } from '@/lib/api/generated'

type Props = {
    products: Product[]
    emptyMessage: string
    t: (key: string, fallback?: string) => string
    isTrash?: boolean
    canRestore?: boolean
    onRestore?: (product: Product) => void
    onRowClick?: (product: Product) => void
    renderActions?: (product: Product) => React.ReactNode
    rowSelection?: {
        selectedIds: Set<string>
        onSelectRow: (id: string, selected: boolean) => void
        onSelectAll: (selected: boolean) => void
        allSelected: boolean
        someSelected: boolean
    }
    pagination?: POSKasirInternalCommonPaginationPagination
    onPageChange?: (page: number) => void
    onLimitChange?: (limit: number) => void
    isFetching?: boolean
}

export function ProductListTable({
    products,
    emptyMessage,
    t,
    isTrash,
    canRestore,
    onRestore,
    onRowClick,
    renderActions,
    rowSelection,
    pagination,
    onPageChange,
    onLimitChange,
    isFetching,
}: Props) {
    const formatMoney = useFormatMoney()

    const defaultActions = useMemo(
        () => (product: Product) =>
            isTrash ? (
                canRestore ? (
                    <button
                        type="button"
                        className="text-sm text-primary hover:underline"
                        onClick={() => onRestore?.(product)}
                    >
                        {t('products.actions.restore')}
                    </button>
                ) : null
            ) : (
                <ProductActions
                    product={product}
                    onEdit={onRowClick ? () => onRowClick(product) : undefined}
                />
            ),
        [canRestore, isTrash, onRestore, onRowClick, t],
    )

    const columns = useMemo<DataGridColumnDef<Product>[]>(
        () => [
            {
                id: 'image',
                header: t('products.table.image'),
                icon: Image,
                defaultVisible: true,
                className: 'hidden sm:table-cell w-[80px]',
                cell: (p) => (
                    <Avatar className={`h-10 w-10 rounded-md border ${isTrash ? 'grayscale' : ''}`}>
                        <AvatarImage src={p.image_url} alt={p.name} className="object-cover" />
                        <AvatarFallback className="rounded-md">
                            <Package className="h-5 w-5 text-muted-foreground" />
                        </AvatarFallback>
                    </Avatar>
                ),
            },
            {
                id: 'name',
                header: t('products.table.name'),
                icon: Package,
                sortable: true,
                filterable: true,
                accessor: (p) => p.name ?? '',
                cell: (p) => (
                    <span className={`font-medium ${isTrash ? 'text-muted-foreground' : ''}`}>{p.name}</span>
                ),
            },
            {
                id: 'category',
                header: t('products.table.category'),
                icon: Tag,
                filterable: true,
                accessor: (p) => (p.categories ?? []).map((c) => c.name).join(' '),
                className: 'hidden md:table-cell',
                defaultVisible: true,
                cell: (p) => (
                    <div className="flex flex-wrap gap-1">
                        {p.categories?.length ? (
                            p.categories.map((cat) => (
                                <Badge
                                    key={cat.id}
                                    variant="outline"
                                    className={`text-sm ${isTrash ? 'opacity-50' : ''}`}
                                >
                                    {cat.name}
                                </Badge>
                            ))
                        ) : (
                            <span className="text-muted-foreground">—</span>
                        )}
                    </div>
                ),
            },
            {
                id: 'price',
                header: t('products.table.price'),
                icon: DollarSign,
                sortable: true,
                accessor: (p) => p.price ?? 0,
                cell: (p) => (
                    <span className={isTrash ? 'text-muted-foreground' : ''}>
                        {formatMoney(p.price || 0)}
                    </span>
                ),
            },
            {
                id: 'stock',
                header: t('products.table.stock'),
                icon: Boxes,
                sortable: true,
                accessor: (p) => p.stock ?? 0,
                cell: (p) =>
                    isTrash ? (
                        <span className="text-muted-foreground">{p.stock}</span>
                    ) : (
                        <Badge variant={p.stock && p.stock > 0 ? 'secondary' : 'destructive'}>{p.stock}</Badge>
                    ),
            },
            {
                id: 'actions',
                header: t('products.table.actions'),
                icon: Settings2,
                align: 'right',
                locked: true,
                cell: (p) => (renderActions ? renderActions(p) : defaultActions(p)),
            },
        ],
        [defaultActions, formatMoney, isTrash, renderActions, t],
    )

    return (
        <DataGrid
            storageKey={isTrash ? 'products-trash-list-grid' : 'products-list-grid'}
            columns={columns}
            data={products}
            getRowId={(p) => String(p.id)}
            emptyMessage={emptyMessage}
            enableClientPagination={false}
            onRowClick={onRowClick}
            rowSelection={rowSelection}
            server={
                pagination && onPageChange
                    ? {
                          pagination,
                          onPageChange,
                          onLimitChange,
                          isFetching,
                      }
                    : undefined
            }
        />
    )
}
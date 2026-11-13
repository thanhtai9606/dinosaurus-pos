import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounce } from '@/hooks/use-debounce'
import { useResetPageOnChange } from '@/hooks/use-reset-page-on-change'
import { useServerListState } from '@/hooks/use-server-list-state'
import { LIST_SCOPES } from '@/stores/list-scopes'
import { productsListQueryOptions } from '@/lib/api/query/products'
import { DataGrid, type DataGridColumnDef } from '@/components/data-table'
import { ListPagination } from '@/components/pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export const Route = createFileRoute('/_dashboard/product-units')({
    component: ProductUnitsPage,
})

type UnitRow = {
    id: string
    code: string
    name: string
    unit: string
    sku?: string | null
    barcode?: string | null
}

function ProductUnitsPage() {
    const { t } = useTranslation()
    const { page, limit, onPageChange, onLimitChange, resetPage } = useServerListState({
        scope: LIST_SCOPES.productUnits,
    })
    const [searchTerm, setSearchTerm] = useState('')
    const debouncedSearch = useDebounce(searchTerm, 400)
    const isSearchPending = searchTerm !== debouncedSearch

    useResetPageOnChange(resetPage, [debouncedSearch])

    const listParams = useMemo(
        () => ({
            page,
            limit,
            search: debouncedSearch || undefined,
        }),
        [page, limit, debouncedSearch],
    )

    const productsQuery = useQuery(productsListQueryOptions(listParams))
    const rows: UnitRow[] = useMemo(
        () =>
            (productsQuery.data?.products ?? []).map((p) => ({
                id: p.id!,
                code: p.code ?? '—',
                name: p.name ?? '',
                unit: p.unit ?? 'pcs',
                sku: p.sku,
                barcode: p.barcode,
            })),
        [productsQuery.data?.products],
    )

    const columns = useMemo<DataGridColumnDef<UnitRow>[]>(
        () => [
            { accessorKey: 'code', header: t('products.fields.code', 'P-code') },
            { accessorKey: 'name', header: t('products.table.name') },
            { accessorKey: 'unit', header: t('products.fields.unit') },
            {
                accessorKey: 'sku',
                header: t('products.fields.sku'),
                cell: ({ row }) => row.original.sku || '—',
            },
            {
                accessorKey: 'barcode',
                header: t('products.fields.barcode'),
                cell: ({ row }) => row.original.barcode || '—',
            },
        ],
        [t],
    )

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('product_units_page.title')}</h1>
                    <p className="text-muted-foreground text-sm">{t('product_units_page.description')}</p>
                </div>
                <Button variant="outline" asChild>
                    <Link to="/product">{t('product_units_page.open_products')}</Link>
                </Button>
            </div>
            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    className="pl-8"
                    placeholder={t('products.search_placeholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <DataGrid
                columns={columns}
                data={rows}
                isLoading={productsQuery.isLoading || isSearchPending}
                emptyMessage={t('products.table.empty')}
            />
            {productsQuery.data?.pagination ? (
                <ListPagination
                    pagination={productsQuery.data.pagination}
                    onPageChange={onPageChange}
                    onLimitChange={onLimitChange}
                />
            ) : null}
        </div>
    )
}

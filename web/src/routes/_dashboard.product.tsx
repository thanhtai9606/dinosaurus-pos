import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, useQuery } from '@tanstack/react-query'
import { useState, useEffect, useMemo } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { useServerListState } from '@/hooks/use-server-list-state'
import { LIST_SCOPES } from '@/stores/list-scopes'
import { type Product, productsListQueryOptions, useTrashProductsListQuery, useRestoreProductMutation, useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation } from '@/lib/api/query/products'
import { categoriesListQueryOptions } from '@/lib/api/query/categories'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { ListPagination } from '@/components/pagination'
import { useTranslation } from 'react-i18next';
import { ProductHeader } from '@/components/products/ProductHeader'
import { ProductFilters } from '@/components/products/ProductFilters'
import { ProductTable } from '@/components/products/ProductTable'
import { ProductGridView } from '@/components/products/ProductGridView'
import { ProductFormDialog } from '@/components/products/ProductFormDialog'

export const Route = createFileRoute('/_dashboard/product')({
    component: ProductsPage,
})

function ProductsPage() {
    const { t } = useTranslation();
    const { page, limit, onPageChange, onLimitChange, resetPage } = useServerListState({ scope: LIST_SCOPES.products })
    const [category, setCategory] = useState<number | undefined>()
    const [currentTab, setCurrentTab] = useState<'active' | 'trash'>('active')
    const [searchTerm, setSearchTerm] = useState('')
    const debouncedSearch = useDebounce(searchTerm, 500)
    const isSearchPending = searchTerm !== debouncedSearch

    useEffect(() => {
        resetPage()
    }, [debouncedSearch, category, currentTab, resetPage])

    const listParams = useMemo(
        () => ({
            page,
            limit,
            search: debouncedSearch || undefined,
            category,
        }),
        [page, limit, debouncedSearch, category],
    )

    const createMutation = useCreateProductMutation()

    const productsQuery = useQuery(productsListQueryOptions(listParams))


    const { data: categoriesData } = useSuspenseQuery(categoriesListQueryOptions())
    const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData as any)?.data || []

    const products = productsQuery.data?.products || []
    const pagination = productsQuery.data?.pagination || {}

    const trashProductsQuery = useTrashProductsListQuery(listParams)
    const canReadTrash = trashProductsQuery.isAllowed
    const trashProducts = trashProductsQuery.data?.products || []
    const trashPagination = trashProductsQuery.data?.pagination || {}

    const restoreMutation = useRestoreProductMutation()

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')

    const handleFilterCategory = (value: string) => {
        setCategory(value === 'all' ? undefined : Number(value))
    }

    const openCreateModal = () => {
        setSelectedProduct(null)
        setIsDialogOpen(true)
    }

    const openEditModal = (product: Product) => {
        setSelectedProduct(product)
        setIsDialogOpen(true)
    }

    const canCreate = createMutation.isAllowed
    const canRestore = restoreMutation.isAllowed

    const { isAllowed: canEdit } = useUpdateProductMutation()
    const { isAllowed: canDelete } = useDeleteProductMutation()
    const hasActions = canEdit || canDelete

    const onRestoreHandler = canRestore ? (p: Product) => p.id && restoreMutation.mutate(p.id) : undefined

    return (
        <div className="flex flex-col gap-6">
            <ProductHeader 
                canCreate={canCreate}
                openCreateModal={openCreateModal}
                t={t}
            />

            <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as 'active' | 'trash')} className="w-full">
                <ProductFilters 
                trashCount={trashPagination.total_data || 0}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                category={category}
                categories={categories}
                onCategoryChange={handleFilterCategory}
                t={t}
                canReadTrash={canReadTrash}
                isSearching={isSearchPending || productsQuery.isFetching}
            />

            <TabsContent value="active" className="space-y-4">
                {viewMode === 'list' ? (
                    <ProductTable 
                        products={products}
                        emptyMessage={t('products.table.empty')}
                        onEdit={openEditModal}
                        t={t}
                        hasActions={hasActions}
                    />
                ) : (
                    <ProductGridView 
                        products={products}
                        emptyMessage={t('products.table.empty')}
                        onEdit={openEditModal}
                        t={t}
                        hasActions={hasActions}
                    />
                )}

                <ListPagination
                    pagination={pagination}
                    onPageChange={onPageChange}
                    onLimitChange={onLimitChange}
                    isFetching={productsQuery.isFetching}
                />
            </TabsContent>

            {canReadTrash && (
                <TabsContent value="trash" className="space-y-4">
                    {viewMode === 'list' ? (
                    <ProductTable 
                        products={trashProducts}
                        emptyMessage={t('products.table.empty_trash')}
                        isTrash={true}
                        canRestore={canRestore}
                        onRestore={onRestoreHandler}
                        t={t}
                    />
                ) : (
                    <ProductGridView 
                        products={trashProducts}
                        emptyMessage={t('products.table.empty_trash')}
                        onRestore={onRestoreHandler}
                        t={t}
                    />
                )}

                    <ListPagination
                        pagination={trashPagination}
                        onPageChange={onPageChange}
                        onLimitChange={onLimitChange}
                        isFetching={trashProductsQuery.isFetching}
                    />
                </TabsContent>
            )}
            </Tabs>

            <ProductFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                productToEdit={selectedProduct}
                categories={categories}
            />
        </div>
    )
}




import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { useServerListState } from '@/hooks/use-server-list-state'
import { LIST_SCOPES } from '@/stores/list-scopes'
import {
    type Product,
    productsListQueryOptions,
    useTrashProductsListQuery,
    useRestoreProductMutation,
    useRestoreBulkProductMutation,
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
} from '@/lib/api/query/products'
import { categoriesListQueryOptions } from '@/lib/api/query/categories'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ProductHeader } from '@/components/products/ProductHeader'
import { ProductFilters } from '@/components/products/ProductFilters'
import { ProductListTable } from '@/components/products/ProductListTable'
import { ProductGridView } from '@/components/products/ProductGridView'
import { ProductFormDialog } from '@/components/products/ProductFormDialog'
import { useRBAC } from '@/lib/auth/rbac'
import { fetchProductDetail } from '@/lib/products/lookupProduct'
import { printProductBarcodes } from '@/lib/products/printProductBarcodes'
import { downloadProductsSpreadsheet } from '@/lib/products/exportProductsSpreadsheet'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/_dashboard/product')({
    component: ProductsPage,
})

function ProductsPage() {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const { canAccessApi } = useRBAC()
    const { page, limit, onPageChange, onLimitChange, resetPage } = useServerListState({ scope: LIST_SCOPES.products })
    const [category, setCategory] = useState<number | undefined>()
    const [currentTab, setCurrentTab] = useState<'active' | 'trash'>('active')
    const [searchTerm, setSearchTerm] = useState('')
    const debouncedSearch = useDebounce(searchTerm, 500)
    const isSearchPending = searchTerm !== debouncedSearch

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [bulkBusy, setBulkBusy] = useState(false)
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

    useEffect(() => {
        resetPage()
    }, [debouncedSearch, category, currentTab, resetPage])

    useEffect(() => {
        setSelectedIds(new Set())
    }, [debouncedSearch, category, currentTab, page])

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
    const restoreBulkMutation = useRestoreBulkProductMutation()
    const deleteMutation = useDeleteProductMutation()

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

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
    const canRestoreBulk = restoreBulkMutation.isAllowed
    const { isAllowed: canEdit } = useUpdateProductMutation()
    const { isAllowed: canDelete } = useDeleteProductMutation()
    const canExportAll = canAccessApi('GET', '/products/export-prices')

    const listProducts = currentTab === 'active' ? products : trashProducts
    const pageRowIds = useMemo(() => listProducts.map((p) => String(p.id)), [listProducts])
    const allSelected = pageRowIds.length > 0 && pageRowIds.every((id) => selectedIds.has(id))
    const someSelected = pageRowIds.some((id) => selectedIds.has(id))

    const toggleRow = useCallback((id: string, checked: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (checked) next.add(id)
            else next.delete(id)
            return next
        })
    }, [])

    const toggleAll = useCallback(
        (checked: boolean) => {
            setSelectedIds((prev) => {
                const next = new Set(prev)
                if (checked) pageRowIds.forEach((id) => next.add(id))
                else pageRowIds.forEach((id) => next.delete(id))
                return next
            })
        },
        [pageRowIds],
    )

    const rowSelection =
        currentTab === 'active' && (canDelete || canExportAll)
            ? {
                  selectedIds,
                  onSelectRow: toggleRow,
                  onSelectAll: toggleAll,
                  allSelected,
                  someSelected,
              }
            : currentTab === 'trash' && canRestoreBulk
              ? {
                    selectedIds,
                    onSelectRow: toggleRow,
                    onSelectAll: toggleAll,
                    allSelected,
                    someSelected,
                }
              : undefined

    const selectedIdList = useMemo(() => [...selectedIds], [selectedIds])

    const runBulk = async (fn: () => Promise<void>) => {
        if (selectedIdList.length === 0) return
        setBulkBusy(true)
        try {
            await fn()
        } finally {
            setBulkBusy(false)
        }
    }

    const handleBulkPrintBarcodes = () =>
        runBulk(async () => {
            try {
                const detailed = await Promise.all(
                    selectedIdList.map(async (id) => {
                        try {
                            return await fetchProductDetail(id)
                        } catch {
                            return null
                        }
                    }),
                )
                const items = detailed.filter((p): p is Product => p != null)
                printProductBarcodes(items)
                toast.success(t('products.bulk.print_started'))
            } catch (e) {
                if (e instanceof Error && e.message === 'NO_PRINTABLE_BARCODES') {
                    toast.error(t('products.bulk.print_no_barcodes'))
                } else if (e instanceof Error && e.message === 'POPUP_BLOCKED') {
                    toast.error(t('products.bulk.print_popup_blocked'))
                } else {
                    toast.error(t('products.bulk.print_failed'))
                }
            }
        })

    const handleBulkExport = () =>
        runBulk(async () => {
            try {
                if (selectedIdList.length === 0) return
                const detailed = await Promise.all(
                    selectedIdList.map((id) => fetchProductDetail(id).catch(() => null)),
                )
                const items = detailed.filter((p): p is Product => p != null)
                if (items.length === 0) {
                    toast.error(t('products.bulk.export_failed'))
                    return
                }
                downloadProductsSpreadsheet(items, 'products_export.csv')
                toast.success(t('products.bulk.export_success'))
            } catch {
                toast.error(t('products.bulk.export_failed'))
            }
        })

    const handleBulkDelete = async () => {
        const ids = selectedIdList
        if (ids.length === 0) return
        setBulkBusy(true)
        let failed = 0
        try {
            for (const id of ids) {
                try {
                    await deleteMutation.mutateAsync(id)
                } catch {
                    failed++
                }
            }
            if (failed === 0) {
                toast.success(t('products.bulk.delete_success', { count: ids.length }))
            } else {
                toast.error(t('products.bulk.delete_partial', { failed, total: ids.length }))
            }
            setSelectedIds(new Set())
            setBulkDeleteOpen(false)
            await qc.invalidateQueries({ queryKey: ['products', 'list'] })
            await qc.invalidateQueries({ queryKey: ['products', 'trash'] })
        } finally {
            setBulkBusy(false)
        }
    }

    const handleBulkRestore = () =>
        runBulk(async () => {
            const ids = selectedIdList
            if (ids.length === 0) return
            try {
                await restoreBulkMutation.mutateAsync({ product_ids: ids })
                setSelectedIds(new Set())
            } catch {
                /* toast from mutation */
            }
        })

    const onRestoreHandler = canRestore ? (p: Product) => p.id && restoreMutation.mutate(p.id) : undefined
    const onRowClick = canEdit ? openEditModal : undefined

    return (
        <div className="flex flex-col gap-6">
            <ProductHeader
                canCreate={canCreate && currentTab === 'active'}
                openCreateModal={openCreateModal}
                t={t}
                selectedCount={selectedIds.size}
                bulkBusy={bulkBusy}
                canDelete={canDelete && currentTab === 'active'}
                canExport={canExportAll && currentTab === 'active'}
                canPrintBarcodes={currentTab === 'active'}
                onBulkDelete={() => setBulkDeleteOpen(true)}
                onBulkExport={() => void handleBulkExport()}
                onBulkPrintBarcodes={() => void handleBulkPrintBarcodes()}
                onBulkRestore={() => void handleBulkRestore()}
                canBulkRestore={canRestoreBulk && currentTab === 'trash'}
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
                        <ProductListTable
                            products={products}
                            emptyMessage={t('products.table.empty')}
                            onRowClick={onRowClick}
                            t={t}
                            rowSelection={rowSelection}
                            pagination={pagination}
                            onPageChange={onPageChange}
                            onLimitChange={onLimitChange}
                            isFetching={productsQuery.isFetching}
                        />
                    ) : (
                        <ProductGridView
                            products={products}
                            emptyMessage={t('products.table.empty')}
                            onEdit={openEditModal}
                            t={t}
                            hasActions={canEdit || canDelete}
                        />
                    )}
                </TabsContent>

                {canReadTrash && (
                    <TabsContent value="trash" className="space-y-4">
                        {viewMode === 'list' ? (
                            <ProductListTable
                                products={trashProducts}
                                emptyMessage={t('products.table.empty_trash')}
                                isTrash
                                canRestore={canRestore}
                                onRestore={onRestoreHandler}
                                onRowClick={onRowClick}
                                t={t}
                                rowSelection={rowSelection}
                                pagination={trashPagination}
                                onPageChange={onPageChange}
                                onLimitChange={onLimitChange}
                                isFetching={trashProductsQuery.isFetching}
                            />
                        ) : (
                            <ProductGridView
                                products={trashProducts}
                                emptyMessage={t('products.table.empty_trash')}
                                onRestore={onRestoreHandler}
                                t={t}
                            />
                        )}
                    </TabsContent>
                )}
            </Tabs>

            <ProductFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                productToEdit={selectedProduct}
                categories={categories}
            />

            <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('products.bulk.delete_confirm_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('products.bulk.delete_confirm_body', { count: selectedIds.size })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={bulkBusy}>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={bulkBusy}
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={(e) => {
                                e.preventDefault()
                                void handleBulkDelete()
                            }}
                        >
                            {bulkBusy ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('products.actions.deleting')}
                                </>
                            ) : (
                                t('products.bulk.delete')
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
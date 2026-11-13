import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    categoriesListQueryOptions,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
    type Category,
} from '@/lib/api/query/categories'
import { CategoryFormDialog } from '@/components/settings/CategoryFormDialog'
import { CategoryActions } from '@/components/settings/CategoryActions'
import { ProductGroupsHeader } from '@/components/productgroups/ProductGroupsHeader'
import { ProductGroupsTable } from '@/components/productgroups/ProductGroupsTable'
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

export const Route = createFileRoute('/_dashboard/product-groups')({
    component: ProductGroupsPage,
})

function ProductGroupsPage() {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const categoriesQuery = useQuery(categoriesListQueryOptions())
    const categories = useMemo(() => {
        const raw = categoriesQuery.data
        return Array.isArray(raw) ? raw : (raw as { data?: Category[] } | undefined)?.data ?? []
    }, [categoriesQuery.data])

    const createMutation = useCreateCategoryMutation()
    const updateMutation = useUpdateCategoryMutation()
    const deleteMutation = useDeleteCategoryMutation()

    const canCreate = createMutation.isAllowed
    const canEdit = updateMutation.isAllowed
    const canDelete = deleteMutation.isAllowed

    const [dialogOpen, setDialogOpen] = useState(false)
    const [selected, setSelected] = useState<Category | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
    const [bulkDeleting, setBulkDeleting] = useState(false)

    const rowIds = useMemo(() => categories.map((c) => String(c.id)), [categories])
    const allSelected = rowIds.length > 0 && rowIds.every((id) => selectedIds.has(id))
    const someSelected = rowIds.some((id) => selectedIds.has(id))

    const openDialog = (category: Category | null) => {
        setSelected(category)
        setDialogOpen(true)
    }

    const toggleRow = (id: string, checked: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (checked) next.add(id)
            else next.delete(id)
            return next
        })
    }

    const toggleAll = (checked: boolean) => {
        setSelectedIds(checked ? new Set(rowIds) : new Set())
    }

    const handleBulkDelete = async () => {
        const ids = [...selectedIds].map((id) => Number(id)).filter((n) => Number.isFinite(n))
        if (ids.length === 0) return
        setBulkDeleting(true)
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
                toast.success(t('product_groups.bulk.delete_success', { count: ids.length }))
            } else {
                toast.error(t('product_groups.bulk.delete_partial', { failed, total: ids.length }))
            }
            setSelectedIds(new Set())
            setBulkDeleteOpen(false)
            await qc.invalidateQueries({ queryKey: ['categories', 'list'] })
        } finally {
            setBulkDeleting(false)
        }
    }

    const rowSelection =
        canDelete
            ? {
                  selectedIds,
                  onSelectRow: toggleRow,
                  onSelectAll: toggleAll,
                  allSelected,
                  someSelected,
              }
            : undefined

    return (
        <div className="flex flex-col gap-4 p-4">
            <ProductGroupsHeader
                t={t}
                canCreate={canCreate}
                canDelete={canDelete}
                selectedCount={selectedIds.size}
                onCreate={() => openDialog(null)}
                onBulkDelete={() => setBulkDeleteOpen(true)}
                bulkDeleting={bulkDeleting}
            />

            <ProductGroupsTable
                categories={categories}
                t={t}
                onRowClick={canEdit ? (c) => openDialog(c) : undefined}
                rowSelection={rowSelection}
                renderActions={(category) =>
                    canEdit || canDelete ? (
                        <CategoryActions category={category} onEdit={() => openDialog(category)} />
                    ) : null
                }
            />

            <CategoryFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                categoryToEdit={selected}
                onDeleted={() => {
                    if (selected?.id) {
                        setSelectedIds((prev) => {
                            const next = new Set(prev)
                            next.delete(String(selected.id))
                            return next
                        })
                    }
                }}
            />

            <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('product_groups.bulk.delete_confirm_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('product_groups.bulk.delete_confirm_body', { count: selectedIds.size })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={bulkDeleting}>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={bulkDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={(e) => {
                                e.preventDefault()
                                void handleBulkDelete()
                            }}
                        >
                            {bulkDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('settings.category.actions.deleting')}
                                </>
                            ) : (
                                t('product_groups.bulk.delete')
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

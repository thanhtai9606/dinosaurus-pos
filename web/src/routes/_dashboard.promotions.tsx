import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useState, useMemo } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { useTranslation } from 'react-i18next'

import {
    promotionsListQueryOptions,
    useDeletePromotionMutation,
    useUpdatePromotionMutation,
    useRestorePromotionMutation,
    useCreatePromotionMutation,
    Promotion
} from '@/lib/api/query/promotions'
import { PromotionFormDialog } from '@/components/promotions/PromotionFormDialog'
import { ListPagination } from '@/components/pagination'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PromotionsHeader } from '@/components/promotions/PromotionsHeader'
import { PromotionsFilters } from '@/components/promotions/PromotionsFilters'
import { PromotionsTable } from '@/components/promotions/PromotionsTable'
import { PromotionsActionDialogs } from '@/components/promotions/PromotionsActionDialogs'

const promotionsSearchSchema = z.object({
    page: z.number().catch(1),
    limit: z.number().min(1).catch(10),
})

export const Route = createFileRoute('/_dashboard/promotions')({
    validateSearch: (search) => promotionsSearchSchema.parse(search),
    loaderDeps: ({ search }) => ({
        page: search.page,
        limit: search.limit,
    }),
    loader: ({ context: { queryClient }, deps }) => {
        return queryClient.ensureQueryData(promotionsListQueryOptions({
            limit: deps.limit,
            page: deps.page,
        }))
    },
    component: PromotionsPage,
})

function PromotionsPage() {
    const { t } = useTranslation()
    const navigate = useNavigate({ from: Route.fullPath })
    const searchParams = Route.useSearch()

    const [activeTab, setActiveTab] = useState("active")

    const promotionsQuery = useQuery(promotionsListQueryOptions({
        limit: searchParams.limit,
        page: searchParams.page,
        trash: activeTab === "trash"
    }))

    const promotions = promotionsQuery.data?.promotions || []
    const pagination = promotionsQuery.data?.pagination || {}

    const [searchTerm, setSearchTerm] = useState('')
    const debouncedSearch = useDebounce(searchTerm, 400)
    const filteredPromotions = useMemo(() => {
        const q = debouncedSearch.trim().toLowerCase()
        if (!q) return promotions
        return promotions.filter((p) => {
            const name = p.name?.toLowerCase() ?? ''
            const code = (p as any).code?.toLowerCase() ?? ''
            return name.includes(q) || code.includes(q)
        })
    }, [promotions, debouncedSearch])


    const deleteMutation = useDeletePromotionMutation()
    const restoreMutation = useRestorePromotionMutation()
    const createMutation = useCreatePromotionMutation()
    const updateMutation = useUpdatePromotionMutation()

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [restoreId, setRestoreId] = useState<string | null>(null)

    const handlePageChange = (newPage: number) => {
        navigate({ search: (prev) => ({ ...prev, page: newPage }) })
    }

    const handleLimitChange = (limit: number) => {
        navigate({ search: (prev) => ({ ...prev, limit, page: 1 }) })
    }

    const openCreateModal = () => {
        setSelectedPromotion(null)
        setIsDialogOpen(true)
    }

    const openEditModal = (promo: Promotion) => {
        setSelectedPromotion(promo)
        setIsDialogOpen(true)
    }

    const handleDelete = (id: string) => {
        setDeleteId(id)
    }

    const handleRestore = (id: string) => {
        setRestoreId(id)
    }

    const confirmDelete = () => {
        if (deleteId) {
            deleteMutation.mutate(deleteId, {
                onSuccess: () => setDeleteId(null)
            })
        }
    }

    const confirmRestore = () => {
        if (restoreId) {
            restoreMutation.mutate(restoreId, {
                onSuccess: () => setRestoreId(null)
            })
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <PromotionsHeader
                t={t}
                onCreateClick={openCreateModal}
                canCreate={createMutation.isAllowed}
            />

            <PromotionsFilters
                t={t}
                search={searchTerm}
                onSearchChange={setSearchTerm}
                isSearching={searchTerm !== debouncedSearch}
            />

            <Tabs defaultValue="active" onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="active">{t('promotions.tabs.active')}</TabsTrigger>
                    <TabsTrigger value="trash">{t('promotions.tabs.trash')}</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-4">
                    <PromotionsTable
                        promotions={filteredPromotions}
                        t={t}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                        isTrash={false}
                        canEdit={updateMutation.isAllowed}
                        canDelete={deleteMutation.isAllowed}
                    />
                </TabsContent>

                <TabsContent value="trash" className="mt-4">
                    <PromotionsTable
                        promotions={filteredPromotions}
                        t={t}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                        onRestore={handleRestore}
                        isTrash={true}
                        canRestore={restoreMutation.isAllowed}
                    />
                </TabsContent>
            </Tabs>

            <ListPagination
                pagination={pagination}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
                isFetching={promotionsQuery.isFetching}
            />

            <PromotionFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                promotionToEdit={selectedPromotion}
            />

            <PromotionsActionDialogs
                deleteId={deleteId}
                setDeleteId={setDeleteId}
                confirmDelete={confirmDelete}
                isDeleting={deleteMutation.isPending}
                restoreId={restoreId}
                setRestoreId={setRestoreId}
                confirmRestore={confirmRestore}
                isRestoring={restoreMutation.isPending}
                t={t}
            />
        </div>
    )
}

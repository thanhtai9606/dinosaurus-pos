import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { customersListQueryOptions, CustomersListParams, useCreateCustomerMutation, useUpdateCustomerMutation, useDeleteCustomerMutation } from '@/lib/api/query/customers'
import { InternalCustomersCustomerResponse } from '@/lib/api/generated'
import { ListPagination } from '@/components/pagination'
import { useTranslation } from 'react-i18next'
import { CustomersHeader } from "@/components/customers/CustomersHeader"
import { CustomersFilters } from "@/components/customers/CustomersFilters"
import { CustomersTable } from "@/components/customers/CustomersTable"
import { CustomerActions } from "@/components/customers/CustomerActions"
import { CustomerFormDialog } from "@/components/customers/CustomerFormDialog"

const customersSearchSchema = z.object({
    page: z.number().catch(1),
    limit: z.number().catch(10),
    search: z.string().optional(),
})

export const Route = createFileRoute('/$locale/_dashboard/customers')({
    validateSearch: (search) => customersSearchSchema.parse(search),

    loaderDeps: ({ search }) => ({
        page: search.page,
        limit: search.limit,
        search: search.search,
    }),

    loader: ({ context: { queryClient }, deps }) => {
        const typedDeps = deps as CustomersListParams;
        return queryClient.ensureQueryData(customersListQueryOptions({
            page: typedDeps.page,
            limit: typedDeps.limit,
            search: typedDeps.search,
        }))
    },

    component: CustomersPage,
})

function CustomersPage() {
    const { t } = useTranslation()
    const navigate = useNavigate({ from: Route.fullPath })
    const searchParams = Route.useSearch() as CustomersListParams

    const customersQuery = useSuspenseQuery(customersListQueryOptions(searchParams))

    const customers = customersQuery.data.customers || []
    const pagination = customersQuery.data.pagination

    const { isAllowed: canCreate } = useCreateCustomerMutation()
    const { isAllowed: canEdit } = useUpdateCustomerMutation()
    const { isAllowed: canDelete } = useDeleteCustomerMutation()

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<InternalCustomersCustomerResponse | null>(null)

    const [searchTerm, setSearchTerm] = useState(searchParams.search || '')
    const debouncedSearch = useDebounce(searchTerm, 500)
    const isSearchPending = searchTerm !== debouncedSearch

    useEffect(() => {
        if (debouncedSearch !== (searchParams.search || '')) {
            navigate({
                search: (prev) => ({ ...prev, search: debouncedSearch || undefined, page: 1 }),
                replace: true,
            })
        }
    }, [debouncedSearch, navigate, searchParams.search])

    const handlePageChange = (newPage: number) => {
        navigate({ search: (prev) => ({ ...prev, page: newPage }) })
    }

    const handleLimitChange = (limit: number) => {
        navigate({ search: (prev) => ({ ...prev, limit, page: 1 }) })
    }

    const openCreateModal = () => {
        setSelectedCustomer(null)
        setIsDialogOpen(true)
    }

    const openEditModal = (customer: InternalCustomersCustomerResponse) => {
        setSelectedCustomer(customer)
        setIsDialogOpen(true)
    }

    return (
        <div className="flex flex-col gap-6">
            <CustomersHeader 
                t={t}
                onCreateClick={openCreateModal}
                canCreate={canCreate}
            />

            <CustomersFilters
                t={t}
                search={searchTerm}
                onSearchChange={setSearchTerm}
                isSearching={isSearchPending || customersQuery.isFetching}
            />

            <CustomersTable 
                customers={customers}
                t={t}
                renderActions={(customer) => (canEdit || canDelete) ? (
                    <CustomerActions customer={customer} onEdit={() => openEditModal(customer)} canEdit={canEdit} canDelete={canDelete} />
                ) : null}
            />

            {pagination && (
                <ListPagination
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                    isFetching={customersQuery.isFetching}
                />
            )}

            <CustomerFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                customerToEdit={selectedCustomer}
            />
        </div>
    )
}

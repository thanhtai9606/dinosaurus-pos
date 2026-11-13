import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { useResetPageOnChange } from '@/hooks/use-reset-page-on-change'
import { useCustomersListStore } from '@/stores/customers-list'
import { customersListQueryOptions, useCreateCustomerMutation, useUpdateCustomerMutation, useDeleteCustomerMutation } from '@/lib/api/query/customers'
import type { CustomerProfile } from '@/lib/api/query/customers'
import { useTranslation } from 'react-i18next'
import { CustomersHeader } from '@/components/customers/CustomersHeader'
import { CustomersFilters } from '@/components/customers/CustomersFilters'
import { CustomersTable } from '@/components/customers/CustomersTable'
import { CustomerActions } from '@/components/customers/CustomerActions'
import { CustomerFormDialog, type CustomerDialogTab } from '@/components/customers/CustomerFormDialog'

export const Route = createFileRoute('/_dashboard/customers')({
    component: CustomersPage,
})

function CustomersPage() {
    const { t } = useTranslation()
    const { page, limit, filters, setFilter, onPageChange, onLimitChange, resetPage } = useCustomersListStore()
    const debouncedSearch = useDebounce(filters.searchTerm, 500)
    const isSearchPending = filters.searchTerm !== debouncedSearch

    useResetPageOnChange(resetPage, [debouncedSearch, filters.groupId])

    const listParams = useMemo(
        () => ({
            page,
            limit,
            search: debouncedSearch || undefined,
            group_id: filters.groupId,
        }),
        [page, limit, debouncedSearch, filters.groupId],
    )

    const customersQuery = useQuery(customersListQueryOptions(listParams))
    const customers = customersQuery.data?.customers || []
    const pagination = customersQuery.data?.pagination

    const { isAllowed: canCreate } = useCreateCustomerMutation()
    const { isAllowed: canEdit } = useUpdateCustomerMutation()
    const { isAllowed: canDelete } = useDeleteCustomerMutation()

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null)
    const [dialogInitialTab, setDialogInitialTab] = useState<CustomerDialogTab>('profile')

    const openCustomerDialog = (customer: CustomerProfile | null, tab: CustomerDialogTab) => {
        setSelectedCustomer(customer)
        setDialogInitialTab(tab)
        setIsDialogOpen(true)
    }

    return (
        <div className="flex flex-col gap-6">
            <CustomersHeader t={t} onCreateClick={() => openCustomerDialog(null, 'profile')} canCreate={canCreate} />

            <CustomersFilters
                t={t}
                search={filters.searchTerm}
                onSearchChange={(v) => setFilter('searchTerm', v, { resetPage: false })}
                groupId={filters.groupId}
                onGroupChange={(v) => setFilter('groupId', v)}
                isSearching={isSearchPending || customersQuery.isFetching}
            />

            <CustomersTable
                customers={customers}
                t={t}
                onRowClick={(customer) => openCustomerDialog(customer, 'orders')}
                server={
                    pagination
                        ? {
                              pagination,
                              onPageChange,
                              onLimitChange,
                              isFetching: customersQuery.isFetching,
                          }
                        : undefined
                }
                renderActions={(customer) =>
                    canEdit || canDelete ? (
                        <CustomerActions
                            customer={customer}
                            onEdit={() => openCustomerDialog(customer, 'profile')}
                            canEdit={canEdit}
                            canDelete={canDelete}
                        />
                    ) : null
                }
            />

            <CustomerFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                customerToEdit={selectedCustomer}
                initialTab={dialogInitialTab}
            />
        </div>
    )
}

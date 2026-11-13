import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { useResetPageOnChange } from '@/hooks/use-reset-page-on-change'
import { useServerListState } from '@/hooks/use-server-list-state'
import { LIST_SCOPES } from '@/stores/list-scopes'
import { useTranslation } from 'react-i18next'
import {
    customerGroupsListQueryOptions,
    useCreateCustomerGroupMutation,
    useUpdateCustomerGroupMutation,
    useDeleteCustomerGroupMutation,
    type CustomerGroup,
} from '@/lib/api/query/customerGroups'
import { CustomerGroupFormDialog } from '@/components/customergroups/CustomerGroupFormDialog'
import { CustomerGroupsHeader } from '@/components/customergroups/CustomerGroupsHeader'
import { CustomerGroupsFilters } from '@/components/customergroups/CustomerGroupsFilters'
import { CustomerGroupsTable } from '@/components/customergroups/CustomerGroupsTable'
import { CustomerGroupActions } from '@/components/customergroups/CustomerGroupActions'

export const Route = createFileRoute('/_dashboard/customer-groups')({
    component: CustomerGroupsPage,
})

function CustomerGroupsPage() {
    const { t } = useTranslation()
    const { page, limit, onPageChange, onLimitChange, resetPage } = useServerListState({
        scope: LIST_SCOPES.customerGroups,
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

    const groupsQuery = useQuery(customerGroupsListQueryOptions(listParams))
    const groups = groupsQuery.data?.groups ?? []
    const pagination = groupsQuery.data?.pagination

    const { isAllowed: canCreate } = useCreateCustomerGroupMutation()
    const { isAllowed: canEdit } = useUpdateCustomerGroupMutation()
    const { isAllowed: canDelete } = useDeleteCustomerGroupMutation()

    const [dialogOpen, setDialogOpen] = useState(false)
    const [selected, setSelected] = useState<CustomerGroup | null>(null)

    const openGroupDialog = (group: CustomerGroup | null) => {
        setSelected(group)
        setDialogOpen(true)
    }

    return (
        <div className="flex flex-col gap-6 p-4">
            <CustomerGroupsHeader
                t={t}
                onCreateClick={() => openGroupDialog(null)}
                canCreate={canCreate}
            />

            <CustomerGroupsFilters
                t={t}
                search={searchTerm}
                onSearchChange={setSearchTerm}
                isSearching={isSearchPending || groupsQuery.isFetching}
            />

            <CustomerGroupsTable
                groups={groups}
                t={t}
                onRowClick={canEdit ? (g) => openGroupDialog(g) : undefined}
                server={
                    pagination
                        ? {
                              pagination,
                              onPageChange,
                              onLimitChange,
                              isFetching: groupsQuery.isFetching,
                          }
                        : undefined
                }
                renderActions={(group) =>
                    canEdit || canDelete ? (
                        <CustomerGroupActions
                            group={group}
                            onEdit={() => openGroupDialog(group)}
                            canEdit={canEdit}
                            canDelete={canDelete}
                        />
                    ) : null
                }
            />

            <CustomerGroupFormDialog open={dialogOpen} onOpenChange={setDialogOpen} groupToEdit={selected} />
        </div>
    )
}

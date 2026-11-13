import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useMemo } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { useServerListState } from '@/hooks/use-server-list-state'
import { LIST_SCOPES } from '@/stores/list-scopes'
import { usersListQueryOptions, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation, useToggleUserStatusMutation } from '@/lib/api/query/user'
import { InternalUserProfileResponse, UsersGetRoleEnum } from '@/lib/api/generated'
import { ListPagination } from '@/components/pagination'
import { useTranslation } from 'react-i18next'
import { UsersHeader } from '@/components/users/UsersHeader'
import { UsersFilters } from '@/components/users/UsersFilters'
import { UsersTable } from '@/components/users/UsersTable'
import { UsersCardView } from '@/components/users/UsersCardView'
import { UserActions } from '@/components/users/UserActions'
import { UserFormDialog } from '@/components/users/UserFormDialog'
import { UserGridSkeleton } from '@/components/ui/list-skeletons'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutGrid, LayoutList } from 'lucide-react'

export const Route = createFileRoute('/_dashboard/users')({
    component: UsersPage,
})

function UsersPage() {
    const { t } = useTranslation()
    const { page, limit, onPageChange, onLimitChange, resetPage } = useServerListState({ scope: LIST_SCOPES.users })
    const [role, setRole] = useState<UsersGetRoleEnum | undefined>()
    const [isActive, setIsActive] = useState<boolean | undefined>()
    const [searchTerm, setSearchTerm] = useState('')
    const debouncedSearch = useDebounce(searchTerm, 500)
    const isSearchPending = searchTerm !== debouncedSearch

    useEffect(() => {
        resetPage()
    }, [debouncedSearch, role, isActive, resetPage])

    const listParams = useMemo(
        () => ({
            page,
            limit,
            search: debouncedSearch || undefined,
            role,
            isActive,
        }),
        [page, limit, debouncedSearch, role, isActive],
    )
    const usersQuery = useQuery(usersListQueryOptions(listParams))

    const users = usersQuery.data?.users || []
    const pagination = usersQuery.data?.pagination

    const { isAllowed: canCreate } = useCreateUserMutation()
    const { isAllowed: canEdit } = useUpdateUserMutation()
    const { isAllowed: canDelete } = useDeleteUserMutation()
    const { isAllowed: canToggle } = useToggleUserStatusMutation()

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<InternalUserProfileResponse | null>(null)
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

    const activeFilter: 'all' | 'active' | 'inactive' =
        isActive === true ? 'active' : isActive === false ? 'inactive' : 'all'

    const handleFilterRole = (value: string) => {
        setRole(value === 'all' ? undefined : (value as UsersGetRoleEnum))
    }

    const handleActiveFilter = (value: 'all' | 'active' | 'inactive') => {
        setIsActive(value === 'all' ? undefined : value === 'active')
    }

    const openCreateModal = () => {
        setSelectedUser(null)
        setIsDialogOpen(true)
    }

    const openEditModal = (user: InternalUserProfileResponse) => {
        setSelectedUser(user)
        setIsDialogOpen(true)
    }

    const renderActions = (user: InternalUserProfileResponse) =>
        canEdit || canDelete || canToggle ? (
            <UserActions
                user={user}
                onEdit={() => openEditModal(user)}
                canEdit={canEdit}
                canDelete={canDelete}
                canToggle={canToggle}
            />
        ) : null

    const showFetchingSkeleton = usersQuery.isFetching && !isSearchPending

    return (
        <div className="flex flex-col gap-6">
            <UsersHeader t={t} onCreateClick={openCreateModal} canCreate={canCreate} />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <UsersFilters
                    t={t}
                    search={searchTerm}
                    onSearchChange={setSearchTerm}
                    role={role}
                    onRoleChange={handleFilterRole}
                    activeFilter={activeFilter}
                    onActiveFilterChange={handleActiveFilter}
                    isSearching={isSearchPending || usersQuery.isFetching}
                />
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'grid')}>
                    <TabsList className="grid h-9 w-[72px] grid-cols-2">
                        <TabsTrigger value="list" className="px-2" title={t('users.view_list')}>
                            <LayoutList className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger value="grid" className="px-2" title={t('users.view_grid')}>
                            <LayoutGrid className="h-4 w-4" />
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {showFetchingSkeleton && viewMode === 'grid' ? (
                <UserGridSkeleton />
            ) : viewMode === 'list' ? (
                <UsersTable
                    users={users}
                    t={t}
                    renderActions={renderActions}
                    server={{
                        pagination,
                        onPageChange,
                        onLimitChange,
                        isFetching: usersQuery.isFetching,
                    }}
                />
            ) : (
                <UsersCardView
                    users={users}
                    t={t}
                    renderActions={renderActions}
                    emptyMessage={t('users.table.empty')}
                />
            )}

            {viewMode === 'grid' ? (
                <ListPagination
                    pagination={pagination}
                    onPageChange={onPageChange}
                    onLimitChange={onLimitChange}
                    isFetching={usersQuery.isFetching}
                />
            ) : null}

            <UserFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} userToEdit={selectedUser} />
        </div>
    )
}

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { usersListQueryOptions, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation, useToggleUserStatusMutation } from '@/lib/api/query/user'
import { InternalUserProfileResponse, UsersGetRoleEnum, UsersGetStatusEnum } from '@/lib/api/generated'
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

const usersSearchSchema = z.object({
    page: z.number().catch(1),
    limit: z.number().catch(10),
    search: z.string().optional(),
    role: z.enum(UsersGetRoleEnum).optional(),
    status: z.enum(UsersGetStatusEnum).optional(),
    is_active: z.boolean().optional(),
})

export const Route = createFileRoute('/_dashboard/users')({
    validateSearch: (search) => usersSearchSchema.parse(search),

    loaderDeps: ({ search }) => ({
        page: search.page,
        limit: search.limit,
        search: search.search,
        role: search.role,
        status: search.status,
        is_active: search.is_active,
    }),

    loader: ({ context: { queryClient }, deps }) => {
        return queryClient.ensureQueryData(usersListQueryOptions({
            page: deps.page,
            limit: deps.limit,
            search: deps.search,
            role: deps.role,
            status: deps.status,
            isActive: deps.is_active,
        }))
    },

    component: UsersPage,
})

function UsersPage() {
    const { t } = useTranslation()
    const navigate = useNavigate({ from: Route.fullPath })
    const searchParams = Route.useSearch()

    const listParams = {
        page: searchParams.page,
        limit: searchParams.limit,
        search: searchParams.search,
        role: searchParams.role,
        status: searchParams.status,
        isActive: searchParams.is_active,
    }
    const usersQuery = useSuspenseQuery(usersListQueryOptions(listParams))

    const users = usersQuery.data.users || []
    const pagination = usersQuery.data.pagination

    const { isAllowed: canCreate } = useCreateUserMutation()
    const { isAllowed: canEdit } = useUpdateUserMutation()
    const { isAllowed: canDelete } = useDeleteUserMutation()
    const { isAllowed: canToggle } = useToggleUserStatusMutation()

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<InternalUserProfileResponse | null>(null)
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

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

    const activeFilter: 'all' | 'active' | 'inactive' =
        searchParams.is_active === true ? 'active' : searchParams.is_active === false ? 'inactive' : 'all'

    const handleFilterRole = (role: string) => {
        navigate({
            search: (prev) => ({ ...prev, role: role === 'all' ? undefined : role as UsersGetRoleEnum, page: 1 }),
        })
    }

    const handleActiveFilter = (value: 'all' | 'active' | 'inactive') => {
        navigate({
            search: (prev) => ({
                ...prev,
                is_active: value === 'all' ? undefined : value === 'active',
                page: 1,
            }),
        })
    }

    const handlePageChange = (newPage: number) => {
        navigate({ search: (prev) => ({ ...prev, page: newPage }) })
    }

    const handleLimitChange = (limit: number) => {
        navigate({ search: (prev) => ({ ...prev, limit, page: 1 }) })
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
                    role={searchParams.role}
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
                        onPageChange: handlePageChange,
                        onLimitChange: handleLimitChange,
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
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                    isFetching={usersQuery.isFetching}
                />
            ) : null}

            <UserFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} userToEdit={selectedUser} />
        </div>
    )
}

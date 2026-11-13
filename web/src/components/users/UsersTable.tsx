import { useMemo } from 'react'
import { Mail, Shield, UserCircle, CircleDot, Settings2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { InternalUserProfileResponse } from '@/lib/api/generated'
import { DataGrid, type DataGridColumnDef } from '@/components/data-table'

interface UsersTableProps {
    users: InternalUserProfileResponse[]
    t: any
    renderActions: (user: InternalUserProfileResponse) => React.ReactNode
    server?: Parameters<typeof DataGrid<InternalUserProfileResponse>>[0]['server']
}

export function UsersTable({ users, t, renderActions, server }: UsersTableProps) {
    const columns = useMemo<DataGridColumnDef<InternalUserProfileResponse>[]>(
        () => [
            {
                id: 'avatar',
                header: t('users.table.avatar'),
                icon: UserCircle,
                defaultVisible: true,
                cell: (user) => (
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar || undefined} alt={user.username} />
                        <AvatarFallback>{user.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                ),
            },
            {
                id: 'user',
                header: t('users.table.user'),
                icon: Mail,
                sortable: true,
                filterable: true,
                filterAccessor: (u) => `${u.username ?? ''} ${u.email ?? ''}`,
                accessor: (u) => u.username ?? '',
                cell: (user) => (
                    <div className="flex flex-col">
                        <span className="font-medium">{user.username}</span>
                        <span className="text-sm text-muted-foreground">{user.email}</span>
                    </div>
                ),
            },
            {
                id: 'role',
                header: t('users.table.role'),
                icon: Shield,
                sortable: true,
                filterable: true,
                filterType: 'select',
                filterAccessor: (u) => u.role ?? '',
                filterOptions: [
                    { value: 'admin', label: 'admin' },
                    { value: 'manager', label: 'manager' },
                    { value: 'cashier', label: 'cashier' },
                    { value: 'owner', label: 'owner' },
                ],
                accessor: (u) => u.role ?? '',
                cell: (user) => <Badge variant="secondary">{user.role}</Badge>,
            },
            {
                id: 'status',
                header: t('users.table.status'),
                icon: CircleDot,
                filterable: true,
                filterType: 'select',
                filterAccessor: (u) => (u.is_active ? 'active' : 'inactive'),
                filterOptions: [
                    { value: 'active', label: t('users.table.active') },
                    { value: 'inactive', label: t('users.table.inactive') },
                ],
                cell: (user) => (
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? t('users.table.active') : t('users.table.inactive')}
                    </Badge>
                ),
            },
            {
                id: 'actions',
                header: t('users.table.actions'),
                icon: Settings2,
                align: 'right',
                locked: true,
                cell: (user) => renderActions(user),
            },
        ],
        [t, renderActions],
    )

    return (
        <DataGrid
            storageKey="users-list-grid"
            columns={columns}
            data={users}
            getRowId={(u) => u.id!}
            emptyMessage={t('users.table.empty')}
            server={server}
            enableClientSort={!server?.onSortChange}
        />
    )
}

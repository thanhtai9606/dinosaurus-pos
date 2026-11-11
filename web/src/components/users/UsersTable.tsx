import { useMemo } from 'react'
import { Mail, Shield, UserCircle, CircleDot, Settings2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { InternalUserProfileResponse } from '@/lib/api/generated'
import { TableColumnHeader } from '@/components/data-table/TableColumnHeader'
import { useClientSort } from '@/hooks/use-client-sort'

interface UsersTableProps {
    users: InternalUserProfileResponse[]
    t: any
    renderActions: (user: InternalUserProfileResponse) => React.ReactNode
}

export function UsersTable({ users, t, renderActions }: UsersTableProps) {
    const getters = useMemo(
        () => ({
            user: (u: InternalUserProfileResponse) => u.username ?? '',
            role: (u: InternalUserProfileResponse) => u.role ?? '',
        }),
        []
    )
    const { sorted, toggleSort, getSortDirection } = useClientSort(users, getters)

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-20">
                            <TableColumnHeader title={t('users.table.avatar')} icon={UserCircle} />
                        </TableHead>
                        <TableHead>
                            <TableColumnHeader
                                title={t('users.table.user')}
                                icon={Mail}
                                sort={getSortDirection('user')}
                                onSort={() => toggleSort('user')}
                            />
                        </TableHead>
                        <TableHead>
                            <TableColumnHeader
                                title={t('users.table.role')}
                                icon={Shield}
                                sort={getSortDirection('role')}
                                onSort={() => toggleSort('role')}
                            />
                        </TableHead>
                        <TableHead>
                            <TableColumnHeader title={t('users.table.status')} icon={CircleDot} />
                        </TableHead>
                        <TableHead className="text-right">
                            <TableColumnHeader title={t('users.table.actions')} icon={Settings2} align="right" />
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sorted.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center">
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <UserCircle className="h-8 w-8 opacity-40" />
                                    {t('users.table.empty')}
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        sorted.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={user.avatar || undefined} alt={user.username} />
                                        <AvatarFallback>{user.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{user.username}</span>
                                        <span className="text-sm text-muted-foreground">{user.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                        {t(`users.roles.${user.role}`)}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.is_active ? 'default' : 'destructive'}>
                                        {user.is_active ? t('users.status.active') : t('users.status.inactive')}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">{renderActions(user)}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

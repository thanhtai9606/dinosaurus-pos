import { Mail, Shield, UserCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { InternalUserProfileResponse } from '@/lib/api/generated'

interface UsersCardViewProps {
    users: InternalUserProfileResponse[]
    t: any
    renderActions: (user: InternalUserProfileResponse) => React.ReactNode
    emptyMessage: string
}

export function UsersCardView({ users, t, renderActions, emptyMessage }: UsersCardViewProps) {
    if (users.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-md border bg-card py-16 text-muted-foreground">
                <UserCircle className="h-10 w-10 opacity-40" />
                {emptyMessage}
            </div>
        )
    }

    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {users.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="flex flex-col gap-3 p-4">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                                <Avatar className="h-11 w-11">
                                    <AvatarImage src={user.avatar || undefined} alt={user.username} />
                                    <AvatarFallback>{user.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="font-semibold truncate">{user.username}</p>
                                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                        <Mail className="h-3 w-3 shrink-0" />
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                            {renderActions(user)}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="capitalize gap-1">
                                <Shield className="h-3 w-3" />
                                {t(`users.roles.${user.role}`)}
                            </Badge>
                            <Badge variant={user.is_active ? 'default' : 'destructive'}>
                                {user.is_active ? t('users.status.active') : t('users.status.inactive')}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

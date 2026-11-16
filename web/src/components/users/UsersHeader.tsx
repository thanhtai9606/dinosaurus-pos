import { Plus, Shield, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UsersHeaderProps {
    t: any
    onCreateClick: () => void
    canCreate?: boolean
    onRolePermissionsClick?: () => void
    canManageRolePermissions?: boolean
}

export function UsersHeader({
    t,
    onCreateClick,
    canCreate = true,
    onRolePermissionsClick,
    canManageRolePermissions = false,
}: UsersHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-heading">{t('users.title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('users.description')}</p>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                {canManageRolePermissions && onRolePermissionsClick ? (
                    <Button variant="outline" onClick={onRolePermissionsClick} className="rounded-xl">
                        <Shield className="mr-2 h-4 w-4" />
                        {t('users.role_permissions_button')}
                    </Button>
                ) : null}
                {canCreate ? (
                    <Button onClick={onCreateClick} className="rounded-xl shadow-md shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" /> {t('users.add_button')}
                    </Button>
                ) : null}
            </div>
        </div>
    )
}

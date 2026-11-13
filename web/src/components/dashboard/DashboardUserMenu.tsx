import { Link } from '@tanstack/react-router'
import { Activity, LogOut, Settings, User as UserIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { POSKasirInternalUserRepositoryUserRole } from '@/lib/api/generated'
import type { DashboardSessionUser } from '@/components/dashboard/types'

interface DashboardUserMenuProps {
    t: (key: string) => string
    user: DashboardSessionUser | null | undefined
    userRole?: POSKasirInternalUserRepositoryUserRole | string
    handleLogout: () => void
}

export function DashboardUserMenu({ t, user, userRole, handleLogout }: DashboardUserMenuProps) {
    const userName = user?.username ?? 'User'
    const userEmail = user?.email ?? ''
    const userAvatar = user?.avatar

    const canSettings =
        userRole === POSKasirInternalUserRepositoryUserRole.UserRoleAdmin ||
        userRole === POSKasirInternalUserRepositoryUserRole.UserRoleManager ||
        userRole === POSKasirInternalUserRepositoryUserRole.UserRoleCashier

    const canActivityLogs = userRole === POSKasirInternalUserRepositoryUserRole.UserRoleAdmin

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    className="h-9 w-9 rounded-full p-0 justify-center transition-colors hover:bg-muted/60"
                >
                    <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={userAvatar || undefined} alt={userName} />
                        <AvatarFallback>
                            <UserIcon className="h-4 w-4" />
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" className="w-56">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userName}</p>
                        {userEmail && (
                            <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                        )}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link to="/account" search={{ tab: 'account' }} className="cursor-pointer">
                        <UserIcon className="mr-2 h-4 w-4" />
                        {t('user_menu.profile')}
                    </Link>
                </DropdownMenuItem>
                {canSettings && (
                    <DropdownMenuItem asChild>
                        <Link to="/settings" search={{ tab: 'preferences' }} className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            {t('user_menu.settings')}
                        </Link>
                    </DropdownMenuItem>
                )}
                {canActivityLogs && (
                    <DropdownMenuItem asChild>
                        <Link
                            to="/activity-logs"
                            search={{ page: 1, limit: 10 }}
                            className="cursor-pointer"
                        >
                            <Activity className="mr-2 h-4 w-4" />
                            {t('user_menu.activity_logs')}
                        </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('common.logout')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

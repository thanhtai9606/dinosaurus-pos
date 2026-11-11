import { Link } from '@tanstack/react-router'
import { Activity, LogOut, Settings, User as UserIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { POSKasirInternalUserRepositoryUserRole } from '@/lib/api/generated'

interface DashboardUserMenuProps {
    t: (key: string) => string
    locale: string
    user: {
        username?: string
        email?: string
        role?: string
        avatar?: string | null
    } | null | undefined
    userRole?: POSKasirInternalUserRepositoryUserRole
    isSidebarCollapsed?: boolean
    handleLogout: () => void
    isMobile?: boolean
}

export function DashboardUserMenu({
    t,
    locale,
    user,
    userRole,
    isSidebarCollapsed,
    handleLogout,
    isMobile = false,
}: DashboardUserMenuProps) {
    const userName = user?.username ?? 'User'
    const userEmail = user?.email ?? ''
    const userAvatar = user?.avatar
    const roleLabel = user?.role ?? userRole ?? ''

    const canSettings =
        userRole === POSKasirInternalUserRepositoryUserRole.UserRoleAdmin ||
        userRole === POSKasirInternalUserRepositoryUserRole.UserRoleManager ||
        userRole === POSKasirInternalUserRepositoryUserRole.UserRoleCashier

    const canActivityLogs = userRole === POSKasirInternalUserRepositoryUserRole.UserRoleAdmin

    const trigger = (
        <Button
            type="button"
            variant="ghost"
            className={cn(
                'h-auto w-full rounded-xl transition-colors hover:bg-muted/60',
                isSidebarCollapsed && !isMobile ? 'justify-center p-2' : 'justify-start gap-3 p-2',
                isMobile && 'justify-start gap-3 px-0 py-2'
            )}
        >
            <Avatar className={cn('h-9 w-9 shrink-0', isSidebarCollapsed && !isMobile && 'h-10 w-10')}>
                <AvatarImage src={userAvatar || undefined} alt={userName} />
                <AvatarFallback>
                    <UserIcon className="h-4 w-4" />
                </AvatarFallback>
            </Avatar>
            {(!isSidebarCollapsed || isMobile) && (
                <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{userName}</p>
                        {userEmail ? (
                            <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                        ) : (
                            <p className="truncate text-xs capitalize text-muted-foreground">{roleLabel}</p>
                        )}
                    </div>
                    {roleLabel && (
                        <Badge variant="outline" className="hidden shrink-0 text-[10px] uppercase sm:inline-flex">
                            {roleLabel}
                        </Badge>
                    )}
                </div>
            )}
        </Button>
    )

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            <DropdownMenuContent
                align={isSidebarCollapsed && !isMobile ? 'center' : 'end'}
                side={isSidebarCollapsed && !isMobile ? 'right' : 'top'}
                className="w-56"
            >
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
                    <Link
                        to="/$locale/account"
                        params={{ locale }}
                        search={{ tab: 'account' }}
                        className="cursor-pointer"
                    >
                        <UserIcon className="mr-2 h-4 w-4" />
                        {t('user_menu.profile')}
                    </Link>
                </DropdownMenuItem>
                {canSettings && (
                    <DropdownMenuItem asChild>
                        <Link
                            to="/$locale/settings"
                            params={{ locale }}
                            search={{ tab: 'cancellation' }}
                            className="cursor-pointer"
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            {t('user_menu.settings')}
                        </Link>
                    </DropdownMenuItem>
                )}
                {canActivityLogs && (
                    <DropdownMenuItem asChild>
                        <Link
                            to="/$locale/activity-logs"
                            params={{ locale }}
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

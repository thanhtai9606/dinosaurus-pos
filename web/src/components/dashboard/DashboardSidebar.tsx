import { Link } from '@tanstack/react-router'
import { Zap, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { SettingsPanel } from "@/components/SettingsPanel.tsx"
import { ShiftControl } from '@/components/dashboard/ShiftControl'
import { DashboardUserMenu } from '@/components/dashboard/DashboardUserMenu'
import { TenantSwitcher } from '@/components/dashboard/TenantSwitcher'
import { DashboardNavMenu } from '@/components/dashboard/DashboardNavMenu'
import type { DashboardMenuEntry } from '@/hooks/useNavigationMenu'

interface DashboardSidebarProps {
    t: any
    branding: any
    isSidebarCollapsed: boolean
    setIsSidebarCollapsed: (collapsed: boolean) => void
    filteredMenu: DashboardMenuEntry[]
    user: any
    userRole?: string
    handleLogout: () => void
}

export function DashboardSidebar({
    t,
    branding,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    filteredMenu,
    user,
    userRole,
    handleLogout
}: DashboardSidebarProps) {
    return (
        <div className="hidden md:block">
            <div className="flex h-full max-h-screen flex-col gap-2 bg-card border-r border-border/50">
                {/* Logo */}
                <div className={cn("flex h-16 items-center px-5", isSidebarCollapsed ? "justify-center" : "justify-between")}>
                    <Link
                        to="/"
                        className={cn("flex items-center gap-3 font-heading font-bold", isSidebarCollapsed && "hidden")}
                    >
                        {branding?.app_logo ? (
                            <img src={branding.app_logo} alt={t('settings.branding.logo')} className="h-9 w-9 object-contain rounded-xl" />
                        ) : (
                            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
                                <Zap className="h-5 w-5 text-primary-foreground" />
                            </div>
                        )}
                        <span className="text-xl truncate tracking-tight">{branding?.app_name || t('dashboard.brand_name')}</span>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="h-8 w-8 rounded-lg"
                    >
                        <Menu className="h-4 w-4" />
                        <span className="sr-only">Toggle Sidebar</span>
                    </Button>
                </div>

                {/* Navigation */}
                <div className="flex-1 py-2">
                    <TooltipProvider delayDuration={0}>
                        <nav className="grid items-start px-3 text-sm font-medium gap-1">
                            <DashboardNavMenu items={filteredMenu} isSidebarCollapsed={isSidebarCollapsed} />
                        </nav>
                    </TooltipProvider>
                </div>

                {/* Bottom section */}
                <div className={cn("mt-auto p-4 space-y-3", isSidebarCollapsed && "p-2")}>
                    {!isSidebarCollapsed && userRole !== 'super_admin' && (
                        <>
                            <div className="hidden md:block">
                                <TenantSwitcher />
                            </div>
                            <div className="hidden md:block">
                                <SettingsPanel />
                            </div>
                            <div className="hidden md:block">
                                <ShiftControl />
                            </div>
                        </>
                    )}

                    <DashboardUserMenu
                        t={t}
                        user={user}
                        userRole={userRole as any}
                        isSidebarCollapsed={isSidebarCollapsed}
                        handleLogout={handleLogout}
                    />
                </div>
            </div>
        </div>
    )
}

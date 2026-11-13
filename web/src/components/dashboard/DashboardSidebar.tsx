import { Link } from '@tanstack/react-router'
import { Zap, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { DashboardNavMenu } from '@/components/dashboard/DashboardNavMenu'
import type { DashboardMenuEntry } from '@/hooks/useNavigationMenu'

interface DashboardSidebarProps {
    t: any
    branding: any
    isSidebarCollapsed: boolean
    setIsSidebarCollapsed: (collapsed: boolean) => void
    filteredMenu: DashboardMenuEntry[]
}

export function DashboardSidebar({
    t,
    branding,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    filteredMenu,
}: DashboardSidebarProps) {
    return (
        <div className="hidden md:block">
            <div className="flex h-full max-h-screen flex-col gap-2 bg-card border-r border-border/50">
                <div className={cn('flex h-16 items-center px-5', isSidebarCollapsed ? 'justify-center' : 'justify-between')}>
                    <Link
                        to="/"
                        className={cn('flex items-center gap-3 font-heading font-bold', isSidebarCollapsed && 'hidden')}
                    >
                        {branding?.app_logo ? (
                            <img
                                src={branding.app_logo}
                                alt={t('settings.branding.logo')}
                                className="h-9 w-9 object-contain rounded-xl"
                            />
                        ) : (
                            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
                                <Zap className="h-5 w-5 text-primary-foreground" />
                            </div>
                        )}
                        <span className="text-xl truncate tracking-tight">
                            {branding?.app_name || t('dashboard.brand_name')}
                        </span>
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

                <div className="flex-1 py-2 overflow-y-auto">
                    <TooltipProvider delayDuration={0}>
                        <nav className="grid items-start px-3 text-sm font-medium gap-1">
                            <DashboardNavMenu items={filteredMenu} isSidebarCollapsed={isSidebarCollapsed} />
                        </nav>
                    </TooltipProvider>
                </div>
            </div>
        </div>
    )
}

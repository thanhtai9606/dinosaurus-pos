import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { DashboardNavMenu } from '@/components/dashboard/DashboardNavMenu'
import { DashboardAppBrand } from '@/components/dashboard/DashboardAppBrand'
import type { DashboardBranding } from '@/components/dashboard/types'
import type { DashboardMenuEntry } from '@/hooks/useNavigationMenu'

interface DashboardSidebarProps {
    branding?: DashboardBranding
    isSidebarCollapsed: boolean
    setIsSidebarCollapsed: (collapsed: boolean) => void
    filteredMenu: DashboardMenuEntry[]
}

export function DashboardSidebar({
    branding,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    filteredMenu,
}: DashboardSidebarProps) {
    return (
        <div className="hidden md:block">
            <div className="flex h-full max-h-screen flex-col gap-2 bg-card border-r border-border/50">
                <div
                    className={cn(
                        'flex h-16 items-center px-5',
                        isSidebarCollapsed ? 'justify-center' : 'justify-between',
                    )}
                >
                    <DashboardAppBrand
                        branding={branding}
                        titleClassName="text-xl"
                        className={cn(isSidebarCollapsed && 'hidden')}
                    />
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

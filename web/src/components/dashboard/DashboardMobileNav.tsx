import { Link } from '@tanstack/react-router'
import { Zap, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DashboardNavMenu } from './DashboardNavMenu'
import type { DashboardMenuEntry } from '@/hooks/useNavigationMenu'

interface DashboardMobileNavProps {
    t: any
    branding: any
    filteredMenu: DashboardMenuEntry[]
}

export function DashboardMobileNav({ t, branding, filteredMenu }: DashboardMobileNavProps) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 rounded-xl h-9 w-9">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">{t('dashboard.toggle_nav')}</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-[280px] gap-0">
                <SheetHeader className="p-4 pb-3 border-b border-border/50">
                    <SheetTitle className="sr-only">Navigation</SheetTitle>
                    <Link to="/" className="flex items-center gap-3 font-heading font-bold">
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
                        <span className="text-sm tracking-tight">
                            {branding?.app_name || t('dashboard.brand_name')}
                        </span>
                    </Link>
                </SheetHeader>

                <nav className="flex-1 overflow-y-auto py-3 px-3">
                    <div className="grid gap-1">
                        <DashboardNavMenu items={filteredMenu} />
                    </div>
                </nav>
            </SheetContent>
        </Sheet>
    )
}

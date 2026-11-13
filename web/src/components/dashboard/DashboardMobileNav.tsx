import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useTranslation } from 'react-i18next'
import { DashboardNavMenu } from './DashboardNavMenu'
import { DashboardAppBrand } from '@/components/dashboard/DashboardAppBrand'
import type { DashboardBranding } from '@/components/dashboard/types'
import type { DashboardMenuEntry } from '@/hooks/useNavigationMenu'

interface DashboardMobileNavProps {
    branding?: DashboardBranding
    filteredMenu: DashboardMenuEntry[]
}

export function DashboardMobileNav({ branding, filteredMenu }: DashboardMobileNavProps) {
    const { t } = useTranslation()

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
                    <DashboardAppBrand branding={branding} titleClassName="text-sm" />
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

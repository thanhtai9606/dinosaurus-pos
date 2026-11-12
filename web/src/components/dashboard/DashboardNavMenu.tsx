import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { DashboardMenuEntry } from '@/hooks/useNavigationMenu'

const linkClass = (extra?: string) =>
    cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground transition-all duration-200',
        'hover:bg-primary/5 hover:text-primary',
        '[&.active]:bg-primary [&.active]:text-primary-foreground [&.active]:shadow-md [&.active]:shadow-primary/20',
        extra,
    )

function isPathActive(pathname: string, to: string) {
    if (to === '/') return pathname === '/'
    return pathname === to || pathname.startsWith(`${to}/`)
}

type DashboardNavMenuProps = {
    items: DashboardMenuEntry[]
    isSidebarCollapsed?: boolean
    onNavigate?: () => void
}

export function DashboardNavMenu({ items, isSidebarCollapsed, onNavigate }: DashboardNavMenuProps) {
    const pathname = useRouterState({ select: (s) => s.location.pathname })

    return (
        <>
            {items.map((entry) => {
                if (entry.type === 'link') {
                    return (
                        <Link
                            key={entry.to}
                            to={entry.to}
                            activeOptions={{ exact: entry.to === '/' }}
                            onClick={onNavigate}
                            className={cn(linkClass(), isSidebarCollapsed && 'justify-center px-2')}
                        >
                            <entry.icon className={cn('h-[18px] w-[18px]', isSidebarCollapsed && 'h-5 w-5')} />
                            {!isSidebarCollapsed && <span>{entry.label}</span>}
                        </Link>
                    )
                }

                const groupActive = entry.children.some((c) => isPathActive(pathname, c.to))

                if (isSidebarCollapsed) {
                    return entry.children.map((child) => (
                        <Link
                            key={child.to}
                            to={child.to}
                            onClick={onNavigate}
                            className={cn(linkClass('justify-center px-2'))}
                            title={child.label}
                        >
                            <child.icon className="h-5 w-5" />
                        </Link>
                    ))
                }

                return (
                    <Collapsible key={entry.label} defaultOpen={groupActive} className="space-y-1">
                        <CollapsibleTrigger
                            className={cn(
                                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/90',
                                'hover:bg-muted/60',
                                groupActive && 'text-primary',
                            )}
                        >
                            <entry.icon className="h-[18px] w-[18px]" />
                            <span className="flex-1 text-left">{entry.label}</span>
                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform [[data-state=open]_&]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-0.5 pl-2">
                            {entry.children.map((child) => (
                                <Link
                                    key={child.to}
                                    to={child.to}
                                    onClick={onNavigate}
                                    className={cn(linkClass('py-2 pl-9 text-sm'))}
                                >
                                    <child.icon className="h-4 w-4 opacity-70" />
                                    <span>{child.label}</span>
                                </Link>
                            ))}
                        </CollapsibleContent>
                    </Collapsible>
                )
            })}
        </>
    )
}

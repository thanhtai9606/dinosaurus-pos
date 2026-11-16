import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Horizontal filter bar above server-driven lists (see ERP-style screenshot). */
export function ListSearchToolbar({
    children,
    className,
}: {
    children: ReactNode
    className?: string
}) {
    return (
        <div className={cn('rounded-lg border bg-card p-3 shadow-sm', className)}>
            <div className="flex flex-wrap items-end gap-x-4 gap-y-3">{children}</div>
        </div>
    )
}

export function ListFilterField({
    label,
    children,
    className,
}: {
    label: string
    children: ReactNode
    className?: string
}) {
    return (
        <div className={cn('flex min-w-[10rem] flex-col gap-1.5', className)}>
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            {children}
        </div>
    )
}
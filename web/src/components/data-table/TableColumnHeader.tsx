import type { LucideIcon } from 'lucide-react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type SortDirection = 'asc' | 'desc' | false

interface TableColumnHeaderProps {
    title: string
    icon?: LucideIcon
    sort?: SortDirection
    onSort?: () => void
    className?: string
    align?: 'left' | 'right'
}

export function TableColumnHeader({
    title,
    icon: Icon,
    sort = false,
    onSort,
    className,
    align = 'left',
}: TableColumnHeaderProps) {
    if (!onSort) {
        return (
            <span className={cn('inline-flex items-center gap-2 font-medium', className)}>
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                {title}
            </span>
        )
    }

    return (
        <Button
            type="button"
            variant="ghost"
            onClick={onSort}
            className={cn(
                'h-8 px-2 font-medium',
                align === 'right' ? 'ml-auto' : '-ml-2',
                className
            )}
        >
            {Icon && <Icon className="mr-2 h-4 w-4" />}
            {title}
            {sort === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
            ) : sort === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
            )}
        </Button>
    )
}

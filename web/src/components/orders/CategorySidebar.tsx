import type { ReactNode } from 'react'
import { Grid3x3, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface OrderCategory {
    id: string
    name: string
    count?: number
}

interface CategorySidebarProps {
    categories: OrderCategory[]
    selectedCategory: string
    onCategorySelect: (categoryId: string) => void
    isLoading?: boolean
    allLabel: string
    title: string
}

const categoryAccent = (id: string) => {
    let hash = 0
    for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i) * 17) % 360
    return `hsl(${hash} 55% 45%)`
}

export function CategorySidebar({
    categories,
    selectedCategory,
    onCategorySelect,
    isLoading,
    allLabel,
    title,
}: CategorySidebarProps) {
    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex h-full flex-col border-r bg-card">
            <div className="border-b p-4">
                <div className="flex items-center gap-2">
                    <Grid3x3 className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">{title}</h3>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
                <div className="space-y-1.5">
                    <CategoryButton
                        active={selectedCategory === 'all'}
                        onClick={() => onCategorySelect('all')}
                        label={allLabel}
                        accent="#64748b"
                        icon={<Grid3x3 className="h-4 w-4" />}
                    />
                    {categories.map((cat) => (
                        <CategoryButton
                            key={cat.id}
                            active={selectedCategory === cat.id}
                            onClick={() => onCategorySelect(cat.id)}
                            label={cat.name}
                            accent={categoryAccent(cat.id)}
                            count={cat.count}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

function CategoryButton({
    active,
    onClick,
    label,
    accent,
    count,
    icon,
}: {
    active: boolean
    onClick: () => void
    label: string
    accent: string
    count?: number
    icon?: ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                active
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-transparent hover:bg-muted/60 text-foreground'
            )}
        >
            <span className="flex min-w-0 items-center gap-2.5">
                <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-white"
                    style={{ backgroundColor: accent }}
                >
                    {icon ?? label.charAt(0).toUpperCase()}
                </span>
                <span className="truncate font-medium">{label}</span>
            </span>
            {count !== undefined && (
                <Badge variant="secondary" className="shrink-0 text-[10px] h-5 px-1.5">
                    {count}
                </Badge>
            )}
        </button>
    )
}

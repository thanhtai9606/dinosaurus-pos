import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type TabSummary = {
    id: string
    itemCount: number
}

type Props = {
    tabs: TabSummary[]
    activeId: string
    onSelect: (id: string) => void
    onAdd: () => void
    onClose: (id: string) => void
    t: (key: string, opts?: Record<string, unknown>) => string
    maxTabs?: number
    className?: string
}

export function RetailPosTabs({ tabs, activeId, onSelect, onAdd, onClose, t, maxTabs = 10, className }: Props) {
    return (
        <div className={cn('flex min-h-10 min-w-0 flex-1 items-center gap-1.5 overflow-x-auto', className)}>
            {tabs.map((tab, index) => {
                const active = tab.id === activeId
                const label = t('retailPos.tabs.order', { n: index + 1 })
                return (
                    <div
                        key={tab.id}
                        className={cn(
                            'flex h-10 shrink-0 items-stretch overflow-hidden rounded-md text-sm shadow-sm',
                            active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                        )}
                    >
                        <button
                            type="button"
                            className="flex max-w-[11rem] items-center gap-1.5 truncate px-3 font-medium"
                            onClick={() => onSelect(tab.id)}
                            title={tab.itemCount > 0 ? `${label} (${tab.itemCount})` : label}
                        >
                            <span className="truncate">{label}</span>
                            {tab.itemCount > 0 && (
                                <span
                                    className={cn(
                                        'shrink-0 rounded px-1.5 text-xs font-semibold tabular-nums',
                                        active
                                            ? 'bg-primary-foreground/20 text-primary-foreground'
                                            : 'bg-background text-foreground',
                                    )}
                                >
                                    {tab.itemCount}
                                </span>
                            )}
                        </button>
                        {tabs.length > 1 && (
                            <button
                                type="button"
                                className={cn(
                                    'flex w-8 shrink-0 items-center justify-center border-l',
                                    active
                                        ? 'border-primary-foreground/25 hover:bg-primary-foreground/10'
                                        : 'border-border/60 hover:bg-background/80',
                                )}
                                aria-label={t('retailPos.tabs.close')}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onClose(tab.id)
                                }}
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                )
            })}
            <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-md"
                disabled={tabs.length >= maxTabs}
                title={t('retailPos.tabs.new')}
                aria-label={t('retailPos.tabs.new')}
                onClick={onAdd}
            >
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    )
}

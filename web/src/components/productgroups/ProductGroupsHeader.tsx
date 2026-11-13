import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
    t: (key: string) => string
    canCreate: boolean
    canDelete: boolean
    selectedCount: number
    onCreate: () => void
    onBulkDelete: () => void
    bulkDeleting?: boolean
}

export function ProductGroupsHeader({
    t,
    canCreate,
    canDelete,
    selectedCount,
    onCreate,
    onBulkDelete,
    bulkDeleting,
}: Props) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('product_groups.title')}</h1>
                <p className="text-muted-foreground text-sm">{t('product_groups.description')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                {selectedCount > 0 && canDelete && (
                    <>
                        <span className="text-sm text-muted-foreground">
                            {t('product_groups.bulk.selected', { count: selectedCount })}
                        </span>
                        <Button variant="destructive" size="sm" disabled={bulkDeleting} onClick={onBulkDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('product_groups.bulk.delete')}
                        </Button>
                    </>
                )}
                {canCreate && (
                    <Button size="sm" onClick={onCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('settings.category.add_button')}
                    </Button>
                )}
            </div>
        </div>
    )
}

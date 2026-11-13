import { Plus, Tags } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CustomerGroupsHeader({
    t,
    onCreateClick,
    canCreate = true,
}: {
    t: (key: string, fallback?: string) => string
    onCreateClick: () => void
    canCreate?: boolean
}) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Tags className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">{t('customerGroups.title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('customerGroups.description')}</p>
                </div>
            </div>
            {canCreate && (
                <Button onClick={onCreateClick} className="rounded-xl shadow-md shadow-primary/20">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('customerGroups.actions.add')}
                </Button>
            )}
        </div>
    )
}

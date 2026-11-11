import { Plus, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PromotionsHeaderProps {
    t: any
    onCreateClick: () => void
    canCreate: boolean
}

export function PromotionsHeader({ t, onCreateClick, canCreate }: PromotionsHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Tag className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-heading">{t('promotions.title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('promotions.description')}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {canCreate && (
                    <Button onClick={onCreateClick} className="rounded-xl shadow-md shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" /> {t('promotions.add_button')}
                    </Button>
                )}
            </div>
        </div>
    )
}

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
    t: (key: string) => string
    canCreate: boolean
    onCreate: () => void
}

export function MeasurementUnitsHeader({ t, canCreate, onCreate }: Props) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('product_units_page.title')}</h1>
                <p className="text-muted-foreground text-sm">{t('product_units_page.description')}</p>
            </div>
            {canCreate && (
                <Button size="sm" onClick={onCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('measurementUnits.add_button')}
                </Button>
            )}
        </div>
    )
}

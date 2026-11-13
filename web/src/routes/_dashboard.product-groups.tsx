import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { CategoriesCard } from '@/components/settings/CategoriesCard'

export const Route = createFileRoute('/_dashboard/product-groups')({
    component: ProductGroupsPage,
})

function ProductGroupsPage() {
    const { t } = useTranslation()
    return (
        <div className="flex flex-col gap-4 p-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('product_groups.title')}</h1>
                <p className="text-muted-foreground text-sm">{t('product_groups.description')}</p>
            </div>
            <CategoriesCard />
        </div>
    )
}

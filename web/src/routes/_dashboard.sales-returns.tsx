import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { SalesReturnPanel } from '@/components/retail-pos/SalesReturnPanel'

export const Route = createFileRoute('/_dashboard/sales-returns')({
    component: SalesReturnsPage,
})

function SalesReturnsPage() {
    const { t } = useTranslation()
    return (
        <div className="space-y-4 p-4">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">{t('sidebar.sales_returns')}</h1>
                <p className="text-sm text-muted-foreground">{t('sidebar.sales_returns_desc')}</p>
            </div>
            <div className="max-w-xl">
                <SalesReturnPanel />
            </div>
        </div>
    )
}

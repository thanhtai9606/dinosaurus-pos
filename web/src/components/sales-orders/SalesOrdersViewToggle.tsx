import { Grid3X3, LayoutList, Receipt, Table2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    type SalesOrdersDetailView,
    type SalesOrdersListView,
} from '@/lib/ui/viewPreferences'

export function SalesOrdersListViewToggle({
    value,
    onChange,
    t,
}: {
    value: SalesOrdersListView
    onChange: (v: SalesOrdersListView) => void
    t: (key: string) => string
}) {
    return (
        <div
            className="flex shrink-0 items-center rounded-lg border bg-muted/40 p-0.5"
            role="group"
            aria-label={t('salesOrders.view.list_label')}
        >
            <Button
                type="button"
                variant={value === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 gap-1.5 px-2.5"
                onClick={() => onChange('table')}
            >
                <Table2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t('salesOrders.view.list_table')}</span>
            </Button>
            <Button
                type="button"
                variant={value === 'cards' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 gap-1.5 px-2.5"
                onClick={() => onChange('cards')}
            >
                <Grid3X3 className="h-4 w-4" />
                <span className="hidden sm:inline">{t('salesOrders.view.list_cards')}</span>
            </Button>
        </div>
    )
}

export function SalesOrdersDetailViewToggle({
    value,
    onChange,
    t,
}: {
    value: SalesOrdersDetailView
    onChange: (v: SalesOrdersDetailView) => void
    t: (key: string) => string
}) {
    return (
        <div
            className="flex items-center rounded-lg border bg-muted/40 p-0.5"
            role="group"
            aria-label={t('salesOrders.view.detail_label')}
        >
            <Button
                type="button"
                variant={value === 'classic' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 gap-1 px-2"
                onClick={() => onChange('classic')}
                title={t('salesOrders.view.detail_classic')}
            >
                <LayoutList className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant={value === 'receipt' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 gap-1 px-2"
                onClick={() => onChange('receipt')}
                title={t('salesOrders.view.detail_receipt')}
            >
                <Receipt className="h-4 w-4" />
            </Button>
        </div>
    )
}

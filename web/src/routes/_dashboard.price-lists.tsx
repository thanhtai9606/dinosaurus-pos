import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { ProductPriceImportDialog } from '@/components/inventory/ProductPriceImportDialog'
import { PriceListEditableGrid } from '@/components/pricelists/PriceListEditableGrid'
import { ListFilterField, ListSearchToolbar } from '@/components/data-table'
import { downloadAuthenticatedFile } from '@/lib/api/downloadBlob'
import { useRBAC } from '@/lib/auth/rbac'
import { useDebounce } from '@/hooks/use-debounce'
import { useServerListState } from '@/hooks/use-server-list-state'
import { LIST_SCOPES } from '@/stores/list-scopes'
import { productsListQueryOptions } from '@/lib/api/query/products'

export const Route = createFileRoute('/_dashboard/price-lists')({
    component: PriceListsPage,
})

function PriceListsPage() {
    const { t } = useTranslation()
    const [importOpen, setImportOpen] = useState(false)
    const [exporting, setExporting] = useState(false)
    const { canAccessApi } = useRBAC()
    const canExport = canAccessApi('GET', '/products/export-prices')

    const { page, limit, onPageChange, onLimitChange, resetPage } = useServerListState({
        scope: LIST_SCOPES.priceLists,
    })
    const [searchTerm, setSearchTerm] = useState('')
    const debouncedSearch = useDebounce(searchTerm, 400)

    useEffect(() => {
        resetPage()
    }, [debouncedSearch, resetPage])

    const listParams = useMemo(
        () => ({
            page,
            limit,
            search: debouncedSearch || undefined,
        }),
        [page, limit, debouncedSearch],
    )

    const { data, isFetching } = useQuery(productsListQueryOptions(listParams))
    const products = data?.products ?? []
    const pagination = data?.pagination

    const runExport = async () => {
        setExporting(true)
        try {
            await downloadAuthenticatedFile('/products/export-prices', 'product_prices_export.xlsx')
            toast.success(t('exportPrices.success'))
        } catch {
            toast.error(t('exportPrices.failed'))
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('price_lists.title')}</h1>
                    <p className="text-muted-foreground text-sm">{t('price_lists.description')}</p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5" disabled={exporting}>
                            {exporting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <FileSpreadsheet className="h-4 w-4" />
                            )}
                            {t('price_lists.excel_menu')}
                            <ChevronDown className="h-4 w-4 opacity-60" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                            {t('price_lists.card_description')}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {canExport && (
                            <DropdownMenuItem disabled={exporting} onClick={() => void runExport()}>
                                <Download className="mr-2 h-4 w-4" />
                                {t('exportPrices.title')}
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setImportOpen(true)}>
                            <Upload className="mr-2 h-4 w-4" />
                            {t('importPrices.title')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <ListSearchToolbar>
                <ListFilterField label={t('price_lists.filters.search_label')} className="min-w-[14rem] flex-1">
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('price_lists.filters.search_placeholder')}
                    />
                </ListFilterField>
            </ListSearchToolbar>

            <PriceListEditableGrid
                products={products}
                emptyMessage={t('price_lists.empty')}
                pagination={pagination}
                onPageChange={onPageChange}
                onLimitChange={onLimitChange}
                isFetching={isFetching}
            />

            <ProductPriceImportDialog open={importOpen} onOpenChange={setImportOpen} />
        </div>
    )
}
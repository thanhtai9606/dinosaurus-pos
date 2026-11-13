import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, queryOptions } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useServerListState } from '@/hooks/use-server-list-state'
import { LIST_SCOPES } from '@/stores/list-scopes'
import { axiosInstance } from '@/lib/api/client'
import { ListPagination } from '@/components/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Download, Loader2, PackagePlus, Upload } from 'lucide-react'
import { ProductPriceImportDialog } from '@/components/inventory/ProductPriceImportDialog'
import { downloadAuthenticatedFile } from '@/lib/api/downloadBlob'
import { toast } from 'sonner'
import { useRBAC } from '@/lib/auth/rbac'

type InventoryList = {
    products: Array<{
        id: string
        name: string
        code?: string | null
        sku?: string | null
        stock: number
        min_stock: number
        unit?: string
    }>
    pagination: { current_page: number; total_page: number; total_data: number; per_page: number }
}

const inventoryQueryOptions = (params: { page?: number; limit?: number; low_stock_only?: boolean }) =>
    queryOptions<InventoryList>({
        queryKey: ['inventory', params],
        queryFn: async () => {
            const res = await axiosInstance.get('/products', {
                params: {
                    page: params.page,
                    limit: params.limit,
                    low_stock_only: params.low_stock_only || undefined,
                },
            })
            return (res.data as { data: InventoryList }).data
        },
    })

export const Route = createFileRoute('/_dashboard/inventory')({
    component: InventoryPage,
})

function InventoryPage() {
    const { t } = useTranslation()
    const { page, limit, onPageChange, onLimitChange, resetPage } = useServerListState({
        scope: LIST_SCOPES.inventory,
        limit: 20,
    })
    const [lowStockOnly, setLowStockOnly] = useState(false)

    useEffect(() => {
        resetPage()
    }, [lowStockOnly, resetPage])
    const listParams = useMemo(
        () => ({ page, limit, low_stock_only: lowStockOnly || undefined }),
        [page, limit, lowStockOnly],
    )
    const { data } = useQuery(inventoryQueryOptions(listParams))
    const [importOpen, setImportOpen] = useState(false)
    const [exporting, setExporting] = useState(false)
    const { canAccessApi } = useRBAC()
    const canExport = canAccessApi('GET', '/products/export-prices')

    return (
        <div className="space-y-4 p-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>{t('inventory.title')}</CardTitle>
                        <CardDescription>{t('inventory.description')}</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {canExport && (
                            <Button
                                variant="outline"
                                disabled={exporting}
                                onClick={async () => {
                                    setExporting(true)
                                    try {
                                        await downloadAuthenticatedFile('/products/export-prices', 'product_prices_export.xlsx')
                                        toast.success(t('exportPrices.success'))
                                    } catch {
                                        toast.error(t('exportPrices.failed'))
                                    } finally {
                                        setExporting(false)
                                    }
                                }}
                            >
                                {exporting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                )}
                                {t('exportPrices.title')}
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => setImportOpen(true)}>
                            <Upload className="mr-2 h-4 w-4" />
                            {t('importPrices.title')}
                        </Button>
                        <Button asChild>
                            <Link to="/stock-receipts/new">
                                <PackagePlus className="mr-2 h-4 w-4" />
                                {t('inventory.create_receipt')}
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Switch checked={lowStockOnly} onCheckedChange={setLowStockOnly} />
                        <Label>{t('inventory.low_stock_only')}</Label>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('products.fields.code', 'P-code')}</TableHead>
                                <TableHead>{t('products.fields.sku')}</TableHead>
                                <TableHead>{t('products.table.name')}</TableHead>
                                <TableHead className="text-right">{t('products.table.stock')}</TableHead>
                                <TableHead className="text-right">{t('products.fields.min_stock')}</TableHead>
                                <TableHead>{t('products.fields.unit')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(data?.products || []).map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-mono text-xs">{p.code || '—'}</TableCell>
                                    <TableCell>{p.sku || '—'}</TableCell>
                                    <TableCell className="font-medium">{p.name}</TableCell>
                                    <TableCell
                                        className={`text-right font-medium ${p.stock <= (p.min_stock ?? 0) ? 'text-destructive' : ''}`}
                                    >
                                        {p.stock}
                                    </TableCell>
                                    <TableCell className="text-right">{p.min_stock ?? 0}</TableCell>
                                    <TableCell>{p.unit || 'pcs'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {data?.pagination ? (
                        <ListPagination
                            pagination={data.pagination}
                            onPageChange={onPageChange}
                            onLimitChange={onLimitChange}
                        />
                    ) : null}
                </CardContent>
            </Card>
            <ProductPriceImportDialog open={importOpen} onOpenChange={setImportOpen} />
        </div>
    )
}

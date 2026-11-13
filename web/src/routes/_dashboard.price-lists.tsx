import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProductPriceImportDialog } from '@/components/inventory/ProductPriceImportDialog'
import { downloadAuthenticatedFile } from '@/lib/api/downloadBlob'
import { useRBAC } from '@/lib/auth/rbac'

export const Route = createFileRoute('/_dashboard/price-lists')({
    component: PriceListsPage,
})

function PriceListsPage() {
    const { t } = useTranslation()
    const [importOpen, setImportOpen] = useState(false)
    const [exporting, setExporting] = useState(false)
    const { canAccessApi } = useRBAC()
    const canExport = canAccessApi('GET', '/products/export-prices')

    return (
        <div className="flex flex-col gap-4 p-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('price_lists.title')}</h1>
                <p className="text-muted-foreground text-sm">{t('price_lists.description')}</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{t('price_lists.card_title')}</CardTitle>
                    <CardDescription>{t('price_lists.card_description')}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {canExport && (
                        <Button
                            variant="outline"
                            disabled={exporting}
                            onClick={async () => {
                                setExporting(true)
                                try {
                                    await downloadAuthenticatedFile(
                                        '/products/export-prices',
                                        'product_prices_export.xlsx',
                                    )
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
                </CardContent>
            </Card>
            <ProductPriceImportDialog open={importOpen} onOpenChange={setImportOpen} />
        </div>
    )
}

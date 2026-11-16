import { FileSpreadsheet, Loader2, Package, Plus, Printer, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProductHeaderProps {
    canCreate: boolean
    openCreateModal: () => void
    t: (key: string, fallback?: string) => string
    selectedCount?: number
    bulkBusy?: boolean
    canDelete?: boolean
    canExport?: boolean
    canPrintBarcodes?: boolean
    onBulkDelete?: () => void
    onBulkExport?: () => void
    onBulkPrintBarcodes?: () => void
    onBulkRestore?: () => void
    canBulkRestore?: boolean
}

export function ProductHeader({
    canCreate,
    openCreateModal,
    t,
    selectedCount = 0,
    bulkBusy,
    canDelete,
    canExport,
    canPrintBarcodes,
    onBulkDelete,
    onBulkExport,
    onBulkPrintBarcodes,
    onBulkRestore,
    canBulkRestore,
}: ProductHeaderProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-heading">{t('products.title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('products.description')}</p>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                {selectedCount > 0 && (
                    <>
                        <span className="text-sm text-muted-foreground">
                            {t('products.bulk.selected', { count: selectedCount })}
                        </span>
                        {canPrintBarcodes && (
                            <Button variant="outline" size="sm" disabled={bulkBusy} onClick={onBulkPrintBarcodes}>
                                {bulkBusy ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Printer className="mr-2 h-4 w-4" />
                                )}
                                {t('products.bulk.print_barcodes')}
                            </Button>
                        )}
                        {canExport && (
                            <Button variant="outline" size="sm" disabled={bulkBusy} onClick={onBulkExport}>
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                {t('products.bulk.export_excel')}
                            </Button>
                        )}
                        {canBulkRestore && (
                            <Button variant="outline" size="sm" disabled={bulkBusy} onClick={onBulkRestore}>
                                {t('products.bulk.restore')}
                            </Button>
                        )}
                        {canDelete && (
                            <Button
                                variant="destructive"
                                size="sm"
                                disabled={bulkBusy}
                                onClick={onBulkDelete}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('products.bulk.delete')}
                            </Button>
                        )}
                    </>
                )}
                {canCreate && (
                    <Button onClick={openCreateModal} className="rounded-xl shadow-md shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" /> {t('products.add_button')}
                    </Button>
                )}
            </div>
        </div>
    )
}
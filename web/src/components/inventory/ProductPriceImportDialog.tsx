import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosInstance } from '@/lib/api/client'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Download, Loader2, Upload } from 'lucide-react'
import { downloadAuthenticatedFile } from '@/lib/api/downloadBlob'
import { useRBAC } from '@/lib/auth/rbac'

type ImportResult = {
    updated: number
    failed: { row: number; message: string }[]
}

export function ProductPriceImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
    const { t } = useTranslation()
    const qc = useQueryClient()
    const inputRef = useRef<HTMLInputElement>(null)
    const [fileName, setFileName] = useState('')
    const { canAccessApi } = useRBAC()
    const allowed = canAccessApi('POST', '/products/import-prices')
    const canTemplate = canAccessApi('GET', '/products/import-prices/template')
    const [downloading, setDownloading] = useState(false)

    const mutation = useMutation({
        mutationFn: async (file: File) => {
            const fd = new FormData()
            fd.append('file', file)
            const res = await axiosInstance.post('/products/import-prices', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            return (res.data as { data: ImportResult }).data
        },
        onSuccess: async (data) => {
            await qc.invalidateQueries({ queryKey: ['products'] })
            await qc.invalidateQueries({ queryKey: ['inventory'] })
            toast.success(t('importPrices.success', { count: data.updated }))
            if (data.failed?.length) {
                toast.warning(t('importPrices.partial_fail', { count: data.failed.length }))
            }
            onOpenChange(false)
            setFileName('')
        },
        onError: () => toast.error(t('importPrices.failed')),
    })

    if (!allowed) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('importPrices.title')}</DialogTitle>
                    <DialogDescription>{t('importPrices.description')}</DialogDescription>
                </DialogHeader>
                <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-2">
                    <p className="font-medium">{t('importPrices.csv_format')}</p>
                    <code className="text-xs block">sku, product_id, cost_price, price</code>
                    <p className="text-muted-foreground text-xs">{t('importPrices.csv_hint')}</p>
                    {canTemplate && (
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={downloading}
                            onClick={async () => {
                                setDownloading(true)
                                try {
                                    await downloadAuthenticatedFile(
                                        '/products/import-prices/template',
                                        'import_prices_template.xlsx',
                                    )
                                } catch {
                                    toast.error(t('importPrices.template_failed'))
                                } finally {
                                    setDownloading(false)
                                }
                            }}
                        >
                            {downloading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            {t('importPrices.download_template')}
                        </Button>
                    )}
                </div>
                <div>
                    <Label>{t('importPrices.file')}</Label>
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) setFileName(f.name)
                        }}
                    />
                    <Button type="button" variant="outline" className="mt-2 w-full" onClick={() => inputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        {fileName || t('importPrices.choose_file')}
                    </Button>
                </div>
                <DialogFooter>
                    <Button
                        disabled={!fileName || mutation.isPending}
                        onClick={() => {
                            const f = inputRef.current?.files?.[0]
                            if (f) mutation.mutate(f)
                        }}
                    >
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('importPrices.submit')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

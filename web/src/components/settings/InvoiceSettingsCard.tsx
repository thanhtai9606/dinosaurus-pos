import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FileText, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
    useInvoiceSettingsQuery,
    useUpdateInvoiceSettingsMutation,
    type InvoiceSettings,
} from '@/lib/api/query/settings'

export function InvoiceSettingsCard() {
    const { t } = useTranslation()
    const { data, isLoading } = useInvoiceSettingsQuery()
    const updateMutation = useUpdateInvoiceSettingsMutation()
    const canEdit = updateMutation.isAllowed

    const [form, setForm] = useState<InvoiceSettings>({
        receipt_header: '',
        receipt_footer: '',
        invoice_prefix: 'INV',
        show_tax_on_receipt: true,
        legal_text: '',
    })

    useEffect(() => {
        if (data) setForm(data)
    }, [data])

    const handleSave = () => {
        updateMutation.mutate(
            {
                receipt_header: form.receipt_header,
                receipt_footer: form.receipt_footer,
                invoice_prefix: form.invoice_prefix,
                show_tax_on_receipt: form.show_tax_on_receipt,
                legal_text: form.legal_text,
            },
            {
                onSuccess: () => toast.success(t('settings.invoice.update_success')),
                onError: (err: { response?: { data?: { message?: string } } }) =>
                    toast.error(err.response?.data?.message || t('settings.invoice.update_error')),
            }
        )
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t('settings.invoice.title')}
                </CardTitle>
                <CardDescription>{t('settings.invoice.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="receipt_header">{t('settings.invoice.receipt_header')}</Label>
                    <Input
                        id="receipt_header"
                        value={form.receipt_header}
                        onChange={(e) => setForm((f) => ({ ...f, receipt_header: e.target.value }))}
                        placeholder={t('settings.invoice.receipt_header_placeholder')}
                        disabled={!canEdit}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="receipt_footer">{t('settings.invoice.receipt_footer')}</Label>
                    <Input
                        id="receipt_footer"
                        value={form.receipt_footer}
                        onChange={(e) => setForm((f) => ({ ...f, receipt_footer: e.target.value }))}
                        placeholder={t('settings.invoice.receipt_footer_placeholder')}
                        disabled={!canEdit}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="invoice_prefix">{t('settings.invoice.invoice_prefix')}</Label>
                    <Input
                        id="invoice_prefix"
                        value={form.invoice_prefix}
                        onChange={(e) => setForm((f) => ({ ...f, invoice_prefix: e.target.value }))}
                        placeholder="INV"
                        disabled={!canEdit}
                        className="max-w-[200px]"
                    />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                    <div>
                        <Label>{t('settings.invoice.show_tax_on_receipt')}</Label>
                        <p className="text-xs text-muted-foreground">{t('settings.invoice.show_tax_help')}</p>
                    </div>
                    <Switch
                        checked={form.show_tax_on_receipt}
                        onCheckedChange={(v) => setForm((f) => ({ ...f, show_tax_on_receipt: v }))}
                        disabled={!canEdit}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="legal_text">{t('settings.invoice.legal_text')}</Label>
                    <Textarea
                        id="legal_text"
                        rows={4}
                        value={form.legal_text}
                        onChange={(e) => setForm((f) => ({ ...f, legal_text: e.target.value }))}
                        placeholder={t('settings.invoice.legal_text_placeholder')}
                        disabled={!canEdit}
                    />
                </div>
                {canEdit && (
                    <Button onClick={handleSave} disabled={updateMutation.isPending}>
                        {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('common.save_changes')}
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}

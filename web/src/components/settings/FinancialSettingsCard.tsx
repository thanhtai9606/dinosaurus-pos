import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { DollarSign, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    useFinancialSettingsQuery,
    useUpdateFinancialSettingsMutation,
    type FinancialSettings,
} from '@/lib/api/query/settings'

export function FinancialSettingsCard() {
    const { t } = useTranslation()
    const { data, isLoading } = useFinancialSettingsQuery()
    const updateMutation = useUpdateFinancialSettingsMutation()
    const canEdit = updateMutation.isAllowed

    const [form, setForm] = useState<FinancialSettings>({
        currency: 'IDR',
        tax_rate: 11,
        service_charge_rate: 0,
        tax_enabled: true,
    })

    useEffect(() => {
        if (data) setForm(data)
    }, [data])

    const handleSave = () => {
        updateMutation.mutate(
            {
                currency: form.currency,
                tax_rate: form.tax_rate,
                service_charge_rate: form.service_charge_rate,
                tax_enabled: form.tax_enabled,
            },
            {
                onSuccess: () => toast.success(t('settings.financial.update_success')),
                onError: () => toast.error(t('settings.financial.update_error')),
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
                    <DollarSign className="h-5 w-5" />
                    {t('settings.financial.title')}
                </CardTitle>
                <CardDescription>{t('settings.financial.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>{t('settings.financial.currency')}</Label>
                        <Select
                            value={form.currency}
                            onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}
                            disabled={!canEdit}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="IDR">IDR (Rp)</SelectItem>
                                <SelectItem value="USD">USD ($)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-lg border p-3 sm:col-span-2">
                        <div>
                            <Label>{t('settings.financial.tax_enabled')}</Label>
                            <p className="text-xs text-muted-foreground">{t('settings.financial.tax_enabled_help')}</p>
                        </div>
                        <Switch
                            checked={form.tax_enabled}
                            onCheckedChange={(v) => setForm((f) => ({ ...f, tax_enabled: v }))}
                            disabled={!canEdit}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tax_rate">{t('settings.financial.tax_rate')}</Label>
                        <Input
                            id="tax_rate"
                            type="number"
                            min={0}
                            max={100}
                            step={0.01}
                            value={form.tax_rate}
                            onChange={(e) => setForm((f) => ({ ...f, tax_rate: Number(e.target.value) }))}
                            disabled={!canEdit}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="service_charge">{t('settings.financial.service_charge_rate')}</Label>
                        <Input
                            id="service_charge"
                            type="number"
                            min={0}
                            max={100}
                            step={0.01}
                            value={form.service_charge_rate}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, service_charge_rate: Number(e.target.value) }))
                            }
                            disabled={!canEdit}
                        />
                    </div>
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

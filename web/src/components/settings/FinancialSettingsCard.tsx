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
import { SupportedCurrenciesEditor } from '@/components/settings/SupportedCurrenciesEditor'
import {
    FALLBACK_POS_QUICK_CASH,
    formatQuickCashAmountList,
    parseQuickCashAmountList,
} from '@/lib/money/quickCash'

export function FinancialSettingsCard() {
    const { t } = useTranslation()
    const { data, isLoading } = useFinancialSettingsQuery()
    const updateMutation = useUpdateFinancialSettingsMutation()
    const canEdit = updateMutation.isAllowed

    const [form, setForm] = useState<FinancialSettings>({
        currency: 'VND',
        tax_rate: 11,
        service_charge_rate: 0,
        tax_enabled: true,
    })
    const [quickCashRetailInput, setQuickCashRetailInput] = useState(
        formatQuickCashAmountList([...FALLBACK_POS_QUICK_CASH.retail])
    )
    const [quickCashStockInput, setQuickCashStockInput] = useState(
        formatQuickCashAmountList([...FALLBACK_POS_QUICK_CASH.stock_receipt])
    )

    useEffect(() => {
        if (data) {
            setForm(data)
            const qc = data.pos_quick_cash
            if (qc?.retail?.length) setQuickCashRetailInput(formatQuickCashAmountList(qc.retail))
            if (qc?.stock_receipt?.length) setQuickCashStockInput(formatQuickCashAmountList(qc.stock_receipt))
        }
    }, [data])

    const handleSave = () => {
        const retail = parseQuickCashAmountList(quickCashRetailInput)
        const stock_receipt = parseQuickCashAmountList(quickCashStockInput)
        if (retail.length === 0 || retail.length > 8 || stock_receipt.length === 0 || stock_receipt.length > 8) {
            toast.error(t('settings.financial.quick_cash_validation'))
            return
        }
        updateMutation.mutate(
            {
                currency: form.currency,
                tax_rate: form.tax_rate,
                service_charge_rate: form.service_charge_rate,
                tax_enabled: form.tax_enabled,
                pos_quick_cash: { retail, stock_receipt },
            },
            {
                onSuccess: () => toast.success(t('settings.financial.update_success')),
                onError: (err: { response?: { data?: { message?: string } } }) =>
                    toast.error(err.response?.data?.message || t('settings.financial.update_error')),
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
                                {(data?.available_currencies ?? []).map((c) => (
                                    <SelectItem key={c.code} value={c.code}>
                                        {c.label}
                                    </SelectItem>
                                ))}
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
                <div className="space-y-4 rounded-lg border p-4">
                    <div>
                        <p className="font-medium">{t('settings.financial.quick_cash_title')}</p>
                        <p className="text-xs text-muted-foreground">{t('settings.financial.quick_cash_help')}</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="quick_cash_retail">{t('settings.financial.quick_cash_retail')}</Label>
                            <Input
                                id="quick_cash_retail"
                                value={quickCashRetailInput}
                                onChange={(e) => setQuickCashRetailInput(e.target.value)}
                                disabled={!canEdit}
                                placeholder="10000, 20000, 50000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quick_cash_stock">{t('settings.financial.quick_cash_stock')}</Label>
                            <Input
                                id="quick_cash_stock"
                                value={quickCashStockInput}
                                onChange={(e) => setQuickCashStockInput(e.target.value)}
                                disabled={!canEdit}
                                placeholder="100000, 200000, 500000"
                            />
                        </div>
                    </div>
                </div>
                <SupportedCurrenciesEditor currencies={data?.available_currencies ?? []} />
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

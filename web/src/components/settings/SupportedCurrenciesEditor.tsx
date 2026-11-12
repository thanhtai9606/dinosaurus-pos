import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    useUpdateSupportedCurrenciesMutation,
    type CurrencyOption,
} from '@/lib/api/query/settings'

type Props = {
    currencies: CurrencyOption[]
    disabled?: boolean
}

const emptyRow = (): CurrencyOption => ({
    code: '',
    label: '',
    locale: 'en-US',
    fraction_digits: 2,
})

export function SupportedCurrenciesEditor({ currencies, disabled }: Props) {
    const { t } = useTranslation()
    const saveMutation = useUpdateSupportedCurrenciesMutation()
    const canEdit = saveMutation.isAllowed && !disabled
    const [rows, setRows] = useState<CurrencyOption[]>(currencies)

    useEffect(() => {
        setRows(currencies.length > 0 ? currencies : [emptyRow()])
    }, [currencies])

    const handleSave = () => {
        const payload = rows
            .map((r) => ({
                code: r.code.trim().toUpperCase(),
                label: r.label.trim() || r.code.trim().toUpperCase(),
                locale: r.locale.trim() || 'en-US',
                fraction_digits: Number(r.fraction_digits) || 0,
            }))
            .filter((r) => r.code.length === 3)
        if (payload.length === 0) {
            toast.error(t('settings.financial.currencies_min_one'))
            return
        }
        saveMutation.mutate(payload, {
            onSuccess: () => toast.success(t('settings.financial.currencies_save_success')),
            onError: (err: { response?: { data?: { message?: string } } }) =>
                toast.error(err.response?.data?.message || t('settings.financial.currencies_save_error')),
        })
    }

    return (
        <div className="space-y-3 rounded-lg border p-4">
            <div>
                <Label className="text-base">{t('settings.financial.currencies_list_title')}</Label>
                <p className="text-xs text-muted-foreground mt-1">{t('settings.financial.currencies_list_help')}</p>
            </div>
            <div className="space-y-2">
                {rows.map((row, idx) => (
                    <div key={idx} className="grid gap-2 sm:grid-cols-12 items-end">
                        <div className="sm:col-span-2">
                            <Label className="text-xs">{t('settings.financial.currency_code')}</Label>
                            <Input
                                maxLength={3}
                                value={row.code}
                                disabled={!canEdit}
                                onChange={(e) =>
                                    setRows((prev) =>
                                        prev.map((r, i) =>
                                            i === idx ? { ...r, code: e.target.value.toUpperCase() } : r
                                        )
                                    )
                                }
                                placeholder="VND"
                            />
                        </div>
                        <div className="sm:col-span-4">
                            <Label className="text-xs">{t('settings.financial.currency_label')}</Label>
                            <Input
                                value={row.label}
                                disabled={!canEdit}
                                onChange={(e) =>
                                    setRows((prev) =>
                                        prev.map((r, i) => (i === idx ? { ...r, label: e.target.value } : r))
                                    )
                                }
                                placeholder="VND (₫)"
                            />
                        </div>
                        <div className="sm:col-span-3">
                            <Label className="text-xs">{t('settings.financial.currency_locale')}</Label>
                            <Input
                                value={row.locale}
                                disabled={!canEdit}
                                onChange={(e) =>
                                    setRows((prev) =>
                                        prev.map((r, i) => (i === idx ? { ...r, locale: e.target.value } : r))
                                    )
                                }
                                placeholder="vi-VN"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <Label className="text-xs">{t('settings.financial.currency_decimals')}</Label>
                            <Input
                                type="number"
                                min={0}
                                max={4}
                                value={row.fraction_digits}
                                disabled={!canEdit}
                                onChange={(e) =>
                                    setRows((prev) =>
                                        prev.map((r, i) =>
                                            i === idx ? { ...r, fraction_digits: Number(e.target.value) } : r
                                        )
                                    )
                                }
                            />
                        </div>
                        <div className="sm:col-span-1 flex justify-end pb-0.5">
                            {canEdit && rows.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {canEdit && (
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setRows((p) => [...p, emptyRow()])}>
                        <Plus className="mr-1 h-4 w-4" />
                        {t('settings.financial.add_currency')}
                    </Button>
                    <Button type="button" size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
                        {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('settings.financial.save_currencies')}
                    </Button>
                </div>
            )}
        </div>
    )
}

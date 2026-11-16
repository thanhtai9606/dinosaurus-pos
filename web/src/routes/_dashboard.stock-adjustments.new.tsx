import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { axiosInstance } from '@/lib/api/client'
import { useWarehousesListQuery } from '@/lib/api/query/warehouses'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export const Route = createFileRoute('/_dashboard/stock-adjustments/new')({
    component: NewStockAdjustmentPage,
})

function NewStockAdjustmentPage() {
    const { t } = useTranslation()
    const nav = useNavigate()
    const { data: whList } = useWarehousesListQuery({ limit: 50, page: 1 })
    const [warehouseId, setWarehouseId] = useState('')
    const [productId, setProductId] = useState('')
    const [delta, setDelta] = useState('0')
    const [reason, setReason] = useState('correction')

    return (
        <div className="mx-auto max-w-lg space-y-4 p-4">
            <h1 className="text-2xl font-bold">{t('stockAdjustments.new')}</h1>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{t('stockAdjustments.form_title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                        <Label>{t('stockAdjustments.warehouse')}</Label>
                        <Select value={warehouseId} onValueChange={setWarehouseId}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('stockAdjustments.pick_warehouse')} />
                            </SelectTrigger>
                            <SelectContent>
                                {(whList?.warehouses ?? []).map((w) => (
                                    <SelectItem key={w.id} value={w.id}>
                                        {w.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <LabeledField
                        label={t('stockAdjustments.product_id')}
                        value={productId}
                        onChange={setProductId}
                        hint={t('stockAdjustments.product_id_hint')}
                    />
                    <LabeledField label={t('stockAdjustments.delta')} value={delta} onChange={setDelta} />
                    <div className="space-y-1.5">
                        <Label>{t('stockAdjustments.reason')}</Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="correction">correction</SelectItem>
                                <SelectItem value="damage">damage</SelectItem>
                                <SelectItem value="restock">restock</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        onClick={async () => {
                            if (!warehouseId || !productId) {
                                toast.error(t('stockAdjustments.validation'))
                                return
                            }
                            try {
                                const res = await axiosInstance.post('/stock-adjustments', {
                                    warehouse_id: warehouseId,
                                    reason,
                                    items: [{ product_id: productId, quantity_delta: Number(delta) || 0 }],
                                })
                                const created = (res.data as { data: { id: string } }).data
                                await axiosInstance.post(`/stock-adjustments/${created.id}/complete`)
                                toast.success(t('stockAdjustments.completed'))
                                nav({ to: '/stock-adjustments' })
                            } catch {
                                toast.error(t('stockAdjustments.create_failed'))
                            }
                        }}
                    >
                        {t('stockAdjustments.save_and_complete')}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

function LabeledField({
    label,
    value,
    onChange,
    hint,
}: {
    label: string
    value: string
    onChange: (v: string) => void
    hint?: string
}) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            <Input value={value} onChange={(e) => onChange(e.target.value)} />
            {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
    )
}
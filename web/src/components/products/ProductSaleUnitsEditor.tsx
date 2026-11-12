import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ProductSaleUnit } from '@/lib/retail-pos/productUnits'

type Props = {
    units: ProductSaleUnit[]
    onChange: (units: ProductSaleUnit[]) => void
    t: (key: string, fallback?: string) => string
}

function emptyAltUnit(sortOrder: number): ProductSaleUnit {
    return {
        name: '',
        is_base: false,
        factor_to_base: 1,
        sell_price: 0,
        barcode: '',
        sku: '',
        sort_order: sortOrder,
    }
}

export function ProductSaleUnitsEditor({ units, onChange, t }: Props) {
    const base = units.find((u) => u.is_base) ?? units[0]
    const alts = units.filter((u) => !u.is_base)

    const setBase = (patch: Partial<ProductSaleUnit>) => {
        if (!base) return
        const next = units.map((u) => (u.is_base ? { ...u, ...patch, factor_to_base: 1, is_base: true } : u))
        onChange(next)
    }

    const setAlt = (index: number, patch: Partial<ProductSaleUnit>) => {
        const target = alts[index]
        if (!target) return
        const next = units.map((u) => (u === target ? { ...u, ...patch, is_base: false } : u))
        onChange(next)
    }

    const addAlt = () => {
        onChange([...units, emptyAltUnit(units.length)])
    }

    const removeAlt = (index: number) => {
        const target = alts[index]
        onChange(units.filter((u) => u !== target))
    }

    if (!base) return null

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <p className="text-sm font-semibold">{t('products.sale_units.title')}</p>
            <p className="text-xs text-muted-foreground">{t('products.sale_units.hint')}</p>

            <div className="grid gap-3 rounded-md bg-muted/30 p-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <Label>{t('products.sale_units.base_name')}</Label>
                    <Input value={base.name} onChange={(e) => setBase({ name: e.target.value })} />
                </div>
                <div>
                    <Label>{t('products.form.price')}</Label>
                    <Input
                        type="number"
                        min={0}
                        value={base.sell_price}
                        onChange={(e) => setBase({ sell_price: Number(e.target.value) })}
                    />
                </div>
                <div>
                    <Label>{t('products.fields.barcode')}</Label>
                    <Input value={base.barcode ?? ''} onChange={(e) => setBase({ barcode: e.target.value || null })} />
                </div>
                <div>
                    <Label>{t('products.fields.sku')}</Label>
                    <Input value={base.sku ?? ''} onChange={(e) => setBase({ sku: e.target.value || null })} />
                </div>
            </div>

            {alts.map((row, index) => (
                <div key={index} className="grid gap-3 rounded-md border p-3 sm:grid-cols-2 lg:grid-cols-6">
                    <div>
                        <Label>{t('products.sale_units.unit_name')}</Label>
                        <Input value={row.name} onChange={(e) => setAlt(index, { name: e.target.value })} />
                    </div>
                    <div>
                        <Label>{t('products.sale_units.factor')}</Label>
                        <Input
                            type="number"
                            min={1}
                            step="any"
                            value={row.factor_to_base}
                            onChange={(e) => setAlt(index, { factor_to_base: Number(e.target.value) })}
                        />
                    </div>
                    <div>
                        <Label>{t('products.form.price')}</Label>
                        <Input
                            type="number"
                            min={0}
                            value={row.sell_price}
                            onChange={(e) => setAlt(index, { sell_price: Number(e.target.value) })}
                        />
                    </div>
                    <div>
                        <Label>{t('products.fields.barcode')}</Label>
                        <Input value={row.barcode ?? ''} onChange={(e) => setAlt(index, { barcode: e.target.value || null })} />
                    </div>
                    <div>
                        <Label>{t('products.fields.sku')}</Label>
                        <Input value={row.sku ?? ''} onChange={(e) => setAlt(index, { sku: e.target.value || null })} />
                    </div>
                    <div className="flex items-end">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeAlt(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addAlt}>
                <Plus className="mr-1 h-4 w-4" />
                {t('products.sale_units.add')}
            </Button>
        </div>
    )
}

import { Plus, Sparkles, Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { MeasurementUnit } from '@/lib/api/query/measurementUnits'
import type { ProductSaleUnit } from '@/lib/retail-pos/productUnits'

type Props = {
    units: ProductSaleUnit[]
    onChange: (units: ProductSaleUnit[]) => void
    catalog: MeasurementUnit[]
    t: (key: string, fallback?: string) => string
}

function defaultBase(catalog: MeasurementUnit[]): ProductSaleUnit {
    const pcs = catalog.find((c) => c.name === 'Cái') ?? catalog[0]
    return {
        measurement_unit_id: pcs?.id,
        name: pcs?.name ?? 'pcs',
        is_base: true,
        factor_to_base: 1,
        sell_price: 0,
        wholesale_price: 0,
        barcode: '',
        sort_order: 0,
    }
}

function emptyAlt(catalog: MeasurementUnit[], sortOrder: number, used: Set<string>): ProductSaleUnit {
    const next = catalog.find((c) => !used.has(c.id))
    return {
        measurement_unit_id: next?.id,
        name: next?.name ?? '',
        is_base: false,
        factor_to_base: 1,
        sell_price: 0,
        wholesale_price: 0,
        barcode: '',
        sort_order: sortOrder,
    }
}

export function ProductSaleUnitsEditor({ units, onChange, catalog, t }: Props) {
    const usedIds = () => new Set(units.map((u) => u.measurement_unit_id).filter(Boolean) as string[])
    const catalogFor = (currentId?: string) =>
        catalog.filter((c) => c.id === currentId || !usedIds().has(c.id))

    const ensureBase = units.length > 0 ? units : [defaultBase(catalog)]

    const patchUnit = (index: number, patch: Partial<ProductSaleUnit>) => {
        const next = [...ensureBase]
        const row = next[index]
        if (!row) return
        let updated = { ...row, ...patch }
        if (patch.measurement_unit_id) {
            const mu = catalog.find((c) => c.id === patch.measurement_unit_id)
            if (mu) {
                updated = { ...updated, name: mu.name, measurement_unit_code: mu.code }
            }
        }
        if (updated.is_base) {
            updated.factor_to_base = 1
        }
        next[index] = updated
        onChange(next)
    }

    const setAsBase = (index: number) => {
        onChange(
            ensureBase.map((u, i) => ({
                ...u,
                is_base: i === index,
                factor_to_base: i === index ? 1 : u.factor_to_base > 0 ? u.factor_to_base : 1,
            })),
        )
    }

    const addUnit = () => {
        const used = usedIds()
        onChange([...ensureBase, emptyAlt(catalog, ensureBase.length, used)])
    }

    const removeUnit = (index: number) => {
        const row = ensureBase[index]
        if (row?.is_base) return
        onChange(ensureBase.filter((_, i) => i !== index))
    }

    if (catalog.length === 0) {
        return (
            <p className="text-sm text-muted-foreground rounded-md border p-4">
                {t('products.sale_units.no_catalog', 'Add measurement units in Settings → Units first.')}
            </p>
        )
    }

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <p className="text-sm font-semibold">{t('products.sale_units.title')}</p>
            <p className="text-xs text-muted-foreground">{t('products.sale_units.hint')}</p>

            {ensureBase.map((row, index) => (
                <div
                    key={row.id ?? `${row.measurement_unit_id}-${index}`}
                    className="grid gap-3 rounded-md border p-3 sm:grid-cols-2 lg:grid-cols-8"
                >
                    <div className="lg:col-span-2">
                        <Label>{t('products.sale_units.measurement_unit')}</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={row.measurement_unit_id ?? ''}
                            onChange={(e) => patchUnit(index, { measurement_unit_id: e.target.value })}
                        >
                            <option value="">{t('products.sale_units.pick_unit')}</option>
                            {catalogFor(row.measurement_unit_id).map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {!row.is_base ? (
                        <div>
                            <Label>{t('products.sale_units.factor')}</Label>
                            <Input
                                type="number"
                                min={1}
                                step="any"
                                value={row.factor_to_base}
                                onChange={(e) => patchUnit(index, { factor_to_base: Number(e.target.value) })}
                            />
                        </div>
                    ) : (
                        <div className="flex items-end text-xs text-muted-foreground pb-2">
                            <Star className="mr-1 h-3 w-3 fill-amber-400 text-amber-400" />
                            {t('products.sale_units.base_badge')}
                        </div>
                    )}
                    <div>
                        <Label>{t('products.sale_units.retail_price')}</Label>
                        <Input
                            type="number"
                            min={0}
                            value={row.sell_price}
                            onChange={(e) => patchUnit(index, { sell_price: Number(e.target.value) })}
                        />
                    </div>
                    <div>
                        <Label>{t('products.sale_units.wholesale_price')}</Label>
                        <Input
                            type="number"
                            min={0}
                            value={row.wholesale_price ?? 0}
                            onChange={(e) => patchUnit(index, { wholesale_price: Number(e.target.value) })}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <Label>{t('products.fields.barcode')}</Label>
                        <div className="flex gap-2">
                            <Input
                                value={row.barcode ?? ''}
                                onChange={(e) => patchUnit(index, { barcode: e.target.value || null })}
                                placeholder={t('products.sale_units.barcode_placeholder')}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                title={t('products.sale_units.generate_barcode')}
                                onClick={() => patchUnit(index, { barcode: null })}
                            >
                                <Sparkles className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{t('products.sale_units.barcode_hint')}</p>
                    </div>
                    <div className="flex items-end gap-1">
                        {!row.is_base && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeUnit(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        )}
                        {!row.is_base && (
                            <Button type="button" variant="secondary" size="sm" onClick={() => setAsBase(index)}>
                                {t('products.sale_units.set_base')}
                            </Button>
                        )}
                    </div>
                </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addUnit} disabled={usedIds().size >= catalog.length}>
                <Plus className="mr-2 h-4 w-4" />
                {t('products.sale_units.add')}
            </Button>
        </div>
    )
}

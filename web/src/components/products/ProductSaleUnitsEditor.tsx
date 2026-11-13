import { Link } from '@tanstack/react-router'
import { Plus, Sparkles, Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { MeasurementUnit } from '@/lib/api/query/measurementUnits'
import type { ProductSaleUnit } from '@/lib/retail-pos/productUnits'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Props = {
    units: ProductSaleUnit[]
    onChange: (units: ProductSaleUnit[]) => void
    catalog: MeasurementUnit[]
    t: (key: string, fallback?: string) => string
    currencySymbol?: string
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

function MoneyInput({
    value,
    onChange,
    currencySymbol,
    className,
}: {
    value: number
    onChange: (n: number) => void
    currencySymbol?: string
    className?: string
}) {
    return (
        <div className={cn('relative min-w-[7rem]', className)}>
            {currencySymbol ? (
                <span className="absolute left-2 top-2 text-xs text-muted-foreground">{currencySymbol}</span>
            ) : null}
            <Input
                type="text"
                inputMode="numeric"
                className={cn('h-9', currencySymbol && 'pl-6')}
                value={value ? value.toLocaleString('id-ID') : ''}
                onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    onChange(Number(val) || 0)
                }}
            />
        </div>
    )
}

export function ProductSaleUnitsEditor({ units, onChange, catalog, t, currencySymbol }: Props) {
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
            <div className="space-y-3 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                <p>{t('products.sale_units.no_catalog')}</p>
                <Button type="button" variant="secondary" size="sm" asChild>
                    <Link to="/product-units">{t('products.sale_units.open_units_menu')}</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-3 rounded-lg border bg-card p-4">
            <div>
                <p className="text-sm font-semibold">{t('products.sale_units.title')}</p>
                <p className="text-xs text-muted-foreground">{t('products.sale_units.hint')}</p>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="min-w-[9rem]">{t('products.sale_units.measurement_unit')}</TableHead>
                        <TableHead className="w-[5.5rem]">{t('products.sale_units.factor')}</TableHead>
                        <TableHead className="min-w-[7.5rem]">{t('products.sale_units.retail_price')}</TableHead>
                        <TableHead className="min-w-[7.5rem]">{t('products.sale_units.wholesale_price')}</TableHead>
                        <TableHead className="min-w-[10rem]">{t('products.fields.barcode')}</TableHead>
                        <TableHead className="w-[7rem] text-right">{t('common.actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {ensureBase.map((row, index) => (
                        <TableRow key={row.id ?? `${row.measurement_unit_id}-${index}`}>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <select
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
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
                                    {row.is_base ? (
                                        <Badge variant="secondary" className="w-fit gap-1 text-[10px]">
                                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                            {t('products.sale_units.base_badge')}
                                        </Badge>
                                    ) : null}
                                </div>
                            </TableCell>
                            <TableCell>
                                {row.is_base ? (
                                    <span className="text-xs text-muted-foreground">1×</span>
                                ) : (
                                    <Input
                                        type="number"
                                        min={1}
                                        step="any"
                                        className="h-9"
                                        value={row.factor_to_base}
                                        onChange={(e) => patchUnit(index, { factor_to_base: Number(e.target.value) })}
                                    />
                                )}
                            </TableCell>
                            <TableCell>
                                <MoneyInput
                                    currencySymbol={currencySymbol}
                                    value={row.sell_price}
                                    onChange={(n) => patchUnit(index, { sell_price: n })}
                                />
                            </TableCell>
                            <TableCell>
                                <MoneyInput
                                    currencySymbol={currencySymbol}
                                    value={row.wholesale_price ?? 0}
                                    onChange={(n) => patchUnit(index, { wholesale_price: n })}
                                />
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-1">
                                    <Input
                                        className="h-9"
                                        value={row.barcode ?? ''}
                                        onChange={(e) => patchUnit(index, { barcode: e.target.value || null })}
                                        placeholder={t('products.sale_units.barcode_placeholder')}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 shrink-0"
                                        title={t('products.sale_units.generate_barcode')}
                                        onClick={() => patchUnit(index, { barcode: null })}
                                    >
                                        <Sparkles className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    {!row.is_base ? (
                                        <>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => removeUnit(index)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs"
                                                onClick={() => setAsBase(index)}
                                            >
                                                {t('products.sale_units.set_base')}
                                            </Button>
                                        </>
                                    ) : null}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addUnit}
                disabled={usedIds().size >= catalog.length}
            >
                <Plus className="mr-2 h-4 w-4" />
                {t('products.sale_units.add')}
            </Button>
            <p className="text-[10px] text-muted-foreground">{t('products.sale_units.barcode_hint')}</p>
        </div>
    )
}

import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { DollarSign, Hash, Loader2, Package, Tag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataGrid, type DataGridColumnDef } from '@/components/data-table'
import {
    type ProductListItem,
    usePatchProductPricesMutation,
} from '@/lib/api/query/products'
import { useFormatMoney, useMoney } from '@/context/MoneyContext'
import { formatProductListCodes } from '@/lib/products/productListCodes'
import type { POSKasirInternalCommonPaginationPagination } from '@/lib/api/generated'
import { cn } from '@/lib/utils'

function InlineMoneyInput({
    value,
    onChange,
    onCommit,
    disabled,
    currencySymbol,
    className,
}: {
    value: number
    onChange: (n: number) => void
    onCommit: () => void
    disabled?: boolean
    currencySymbol?: string
    className?: string
}) {
    return (
        <div className={cn('relative min-w-[6.5rem]', className)}>
            {currencySymbol ? (
                <span className="pointer-events-none absolute left-2 top-2 text-xs text-muted-foreground">
                    {currencySymbol}
                </span>
            ) : null}
            <Input
                type="text"
                inputMode="numeric"
                disabled={disabled}
                className={cn('h-8 text-sm', currencySymbol && 'pl-6')}
                value={value ? value.toLocaleString('id-ID') : ''}
                onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    onChange(Number(val) || 0)
                }}
                onBlur={onCommit}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.currentTarget.blur()
                    }
                }}
            />
        </div>
    )
}

type Props = {
    products: ProductListItem[]
    emptyMessage: string
    pagination?: POSKasirInternalCommonPaginationPagination
    onPageChange?: (page: number) => void
    onLimitChange?: (limit: number) => void
    isFetching?: boolean
}

export function PriceListEditableGrid({
    products,
    emptyMessage,
    pagination,
    onPageChange,
    onLimitChange,
    isFetching,
}: Props) {
    const { t } = useTranslation()
    const formatMoney = useFormatMoney()
    const { currencySymbol } = useMoney()
    const { mutateAsync, isAllowed: canEdit, isPending } = usePatchProductPricesMutation()
    const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
    const [draft, setDraft] = useState<
        Record<string, { cost_price?: number; price?: number; wholesale_price?: number }>
    >({})

    const getCost = useCallback(
        (p: ProductListItem) =>
            draft[p.id!]?.cost_price !== undefined ? draft[p.id!].cost_price! : Number(p.cost_price ?? 0),
        [draft],
    )
    const getPrice = useCallback(
        (p: ProductListItem) =>
            draft[p.id!]?.price !== undefined ? draft[p.id!].price! : Number(p.price ?? 0),
        [draft],
    )
    const getWholesale = useCallback(
        (p: ProductListItem) =>
            draft[p.id!]?.wholesale_price !== undefined
                ? draft[p.id!].wholesale_price!
                : Number(p.wholesale_price ?? 0),
        [draft],
    )

    const commitField = useCallback(
        async (product: ProductListItem, field: 'cost_price' | 'price' | 'wholesale_price') => {
            if (!product.id || !canEdit) return
            const id = product.id
            const nextCost = getCost(product)
            const nextPrice = getPrice(product)
            const nextWholesale = getWholesale(product)
            const prevCost = Number(product.cost_price ?? 0)
            const prevPrice = Number(product.price ?? 0)
            const prevWholesale = Number(product.wholesale_price ?? 0)

            const body: {
                id: string
                cost_price?: number
                price?: number
                wholesale_price?: number
            } = { id }
            let changed = false
            if (field === 'cost_price' && nextCost !== prevCost) {
                body.cost_price = nextCost
                changed = true
            }
            if (field === 'price') {
                const sell = nextPrice > 0 ? nextPrice : prevPrice
                if (sell !== prevPrice) {
                    body.price = sell
                    changed = true
                }
            }
            if (field === 'wholesale_price' && nextWholesale !== prevWholesale) {
                body.wholesale_price = nextWholesale
                changed = true
            }
            if (!changed) {
                setDraft((d) => {
                    const next = { ...d }
                    delete next[id]
                    return next
                })
                return
            }
            if (body.price !== undefined && body.price <= 0) {
                return
            }

            setSavingIds((s) => new Set(s).add(id))
            try {
                await mutateAsync(body)
                setDraft((d) => {
                    const next = { ...d }
                    delete next[id]
                    return next
                })
            } finally {
                setSavingIds((s) => {
                    const next = new Set(s)
                    next.delete(id)
                    return next
                })
            }
        },
        [canEdit, getCost, getPrice, getWholesale, mutateAsync],
    )

    const columns = useMemo<DataGridColumnDef<ProductListItem>[]>(
        () => [
            {
                id: 'sku',
                header: t('price_lists.columns.sku'),
                icon: Hash,
                defaultVisible: true,
                className: 'w-[120px]',
                cell: (p) => (
                    <span className="font-mono text-xs text-muted-foreground">
                        {formatProductListCodes(p) || p.sku || '—'}
                    </span>
                ),
            },
            {
                id: 'name',
                header: t('price_lists.columns.name'),
                icon: Package,
                defaultVisible: true,
                cell: (p) => <span className="font-medium">{p.name}</span>,
            },
            {
                id: 'unit',
                header: t('price_lists.columns.unit'),
                icon: Tag,
                defaultVisible: true,
                className: 'hidden md:table-cell w-[72px]',
                cell: (p) => p.unit || '—',
            },
            {
                id: 'cost_price',
                header: t('price_lists.columns.cost_price'),
                icon: DollarSign,
                defaultVisible: true,
                className: 'w-[8.5rem]',
                cell: (p) => {
                    const rowBusy = p.id ? savingIds.has(p.id) : false
                    if (!canEdit) {
                        return formatMoney(getCost(p))
                    }
                    return (
                        <BusyCell busy={rowBusy || (isPending && rowBusy)}>
                            <InlineMoneyInput
                                value={getCost(p)}
                                currencySymbol={currencySymbol}
                                disabled={rowBusy}
                                onChange={(n) =>
                                    p.id &&
                                    setDraft((d) => ({
                                        ...d,
                                        [p.id!]: { ...d[p.id!], cost_price: n },
                                    }))
                                }
                                onCommit={() => void commitField(p, 'cost_price')}
                            />
                        </BusyCell>
                    )
                },
            },
            {
                id: 'price',
                header: t('price_lists.columns.retail_price'),
                icon: DollarSign,
                defaultVisible: true,
                className: 'w-[8.5rem]',
                cell: (p) => {
                    const rowBusy = p.id ? savingIds.has(p.id) : false
                    if (!canEdit) {
                        return formatMoney(getPrice(p))
                    }
                    return (
                        <BusyCell busy={rowBusy || (isPending && rowBusy)}>
                            <InlineMoneyInput
                                value={getPrice(p)}
                                currencySymbol={currencySymbol}
                                disabled={rowBusy}
                                onChange={(n) =>
                                    p.id &&
                                    setDraft((d) => ({
                                        ...d,
                                        [p.id!]: { ...d[p.id!], price: n },
                                    }))
                                }
                                onCommit={() => void commitField(p, 'price')}
                            />
                        </BusyCell>
                    )
                },
            },
            {
                id: 'wholesale_price',
                header: t('price_lists.columns.wholesale_price'),
                icon: DollarSign,
                defaultVisible: true,
                className: 'w-[8.5rem]',
                cell: (p) => {
                    const rowBusy = p.id ? savingIds.has(p.id) : false
                    if (!canEdit) {
                        return formatMoney(getWholesale(p))
                    }
                    return (
                        <BusyCell busy={rowBusy || (isPending && rowBusy)}>
                            <InlineMoneyInput
                                value={getWholesale(p)}
                                currencySymbol={currencySymbol}
                                disabled={rowBusy}
                                onChange={(n) =>
                                    p.id &&
                                    setDraft((d) => ({
                                        ...d,
                                        [p.id!]: { ...d[p.id!], wholesale_price: n },
                                    }))
                                }
                                onCommit={() => void commitField(p, 'wholesale_price')}
                            />
                        </BusyCell>
                    )
                },
            },
            {
                id: 'stock',
                header: t('price_lists.columns.stock'),
                defaultVisible: true,
                className: 'hidden sm:table-cell w-[72px] text-right',
                cell: (p) => <span className="tabular-nums">{p.stock ?? 0}</span>,
            },
        ],
        [
            canEdit,
            commitField,
            currencySymbol,
            formatMoney,
            getCost,
            getPrice,
            getWholesale,
            isPending,
            savingIds,
            t,
        ],
    )

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base font-semibold">{t('price_lists.grid_title')}</CardTitle>
                <CardDescription className="text-xs">
                    {canEdit ? t('price_lists.grid_help_edit') : t('price_lists.grid_help_readonly')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DataGrid
                    columns={columns}
                    data={products}
                    getRowId={(p) => p.id!}
                    emptyMessage={emptyMessage}
                    storageKey="price-list-grid"
                    enableClientSort
                    enableClientPagination={false}
                    defaultPageSize={20}
                    server={
                        pagination && onPageChange
                            ? {
                                  pagination,
                                  onPageChange,
                                  onLimitChange,
                                  isFetching,
                              }
                            : undefined
                    }
                />
            </CardContent>
        </Card>
    )
}

function BusyCell({ busy, children }: { busy: boolean; children: ReactNode }) {
    return (
        <div className="relative flex items-center gap-1">
            {children}
            {busy ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" /> : null}
        </div>
    )
}
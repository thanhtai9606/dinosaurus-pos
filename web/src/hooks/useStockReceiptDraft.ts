import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { Product } from '@/lib/api/query/products'
import type { StockReceipt } from '@/lib/api/query/stockReceipts'
import { fetchProductByCode, fetchProductDetail } from '@/lib/products/lookupProduct'
import {
    addProductToLines,
    defaultCostSell,
    linesFromApiItems,
    StockReceiptLine,
    stockReceiptLineKey,
} from '@/lib/stock-receipts/receiptLines'
import type { ProductSaleUnit } from '@/lib/retail-pos/productUnits'

type Options = {
    open: boolean
    receiptId: string | null
    detail: StockReceipt | undefined
    readOnly: boolean
    t: (key: string, fallback?: string) => string
}

export function useStockReceiptDraft({ open, receiptId, detail, readOnly, t }: Options) {
    const [lines, setLines] = useState<StockReceiptLine[]>([])
    const [search, setSearch] = useState('')
    const [scanning, setScanning] = useState(false)
    const searchRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!open) return
        if (receiptId && detail) {
            setLines(linesFromApiItems(detail.items))
            setSearch('')
        } else if (!receiptId) {
            setLines([])
            setSearch('')
        }
    }, [open, receiptId, detail])

    useEffect(() => {
        if (open && !readOnly) {
            const id = window.setTimeout(() => searchRef.current?.focus(), 50)
            return () => window.clearTimeout(id)
        }
    }, [open, readOnly, receiptId])

    const addProduct = useCallback((product: Product, preferredUnitId?: string | null) => {
        if (!product.id) return
        setLines((prev) => addProductToLines(prev, product, 1, preferredUnitId))
        setSearch('')
        searchRef.current?.focus()
    }, [])

    const addProductFlow = useCallback(
        async (product: Product, preferredUnitId?: string | null) => {
            let detailProduct = product
            if (product.id) {
                try {
                    detailProduct = await fetchProductDetail(product.id)
                } catch {
                    detailProduct = product
                }
            }
            const unitId = preferredUnitId ?? product.matched_sale_unit_id ?? detailProduct.matched_sale_unit_id
            addProduct(detailProduct, unitId)
        },
        [addProduct],
    )

    const resolveAndAdd = useCallback(
        async (raw: string) => {
            const code = raw.trim()
            if (!code) return
            setScanning(true)
            try {
                const product = await fetchProductByCode(code)
                await addProductFlow(product, product.matched_sale_unit_id)
            } catch {
                toast.error(t('stockReceipts.messages.product_not_found'))
            } finally {
                setScanning(false)
            }
        },
        [addProductFlow, t],
    )

    const updateQuantity = useCallback((lineKey: string, delta: number) => {
        setLines((prev) =>
            prev
                .map((l) => {
                    const key = stockReceiptLineKey(l.product.id!, l.saleUnit)
                    if (key !== lineKey) return l
                    const next = l.quantity + delta
                    if (next < 1) return null
                    return { ...l, quantity: next }
                })
                .filter((l): l is StockReceiptLine => l != null),
        )
    }, [])

    const setQuantity = useCallback((lineKey: string, quantity: number) => {
        setLines((prev) =>
            prev.map((l) => {
                const key = stockReceiptLineKey(l.product.id!, l.saleUnit)
                return key === lineKey ? { ...l, quantity: Math.max(1, quantity) } : l
            }),
        )
    }, [])

    const setUnitCost = useCallback((lineKey: string, unit_cost: number) => {
        setLines((prev) =>
            prev.map((l) => {
                const key = stockReceiptLineKey(l.product.id!, l.saleUnit)
                return key === lineKey ? { ...l, unit_cost } : l
            }),
        )
    }, [])

    const setUnitSell = useCallback((lineKey: string, unit_sell_price: number | undefined) => {
        setLines((prev) =>
            prev.map((l) => {
                const key = stockReceiptLineKey(l.product.id!, l.saleUnit)
                return key === lineKey ? { ...l, unit_sell_price } : l
            }),
        )
    }, [])

    const changeSaleUnit = useCallback((lineKey: string, unit: ProductSaleUnit) => {
        setLines((prev) => {
            const item = prev.find((l) => stockReceiptLineKey(l.product.id!, l.saleUnit) === lineKey)
            if (!item) return prev
            const newKey = stockReceiptLineKey(item.product.id!, unit)
            const merged = prev.filter((l) => stockReceiptLineKey(l.product.id!, l.saleUnit) !== lineKey)
            const existing = merged.find((l) => stockReceiptLineKey(l.product.id!, l.saleUnit) === newKey)
            const qty = existing ? existing.quantity + item.quantity : item.quantity
            const { unit_cost, unit_sell_price } = defaultCostSell(item.product, unit)
            if (existing) {
                return merged.map((l) =>
                    stockReceiptLineKey(l.product.id!, l.saleUnit) === newKey
                        ? { ...l, quantity: qty, saleUnit: unit, unit_cost, unit_sell_price }
                        : l,
                )
            }
            return [...merged, { ...item, saleUnit: unit, quantity: qty, unit_cost, unit_sell_price }]
        })
    }, [])

    const removeLine = useCallback((lineKey: string) => {
        setLines((prev) => prev.filter((l) => stockReceiptLineKey(l.product.id!, l.saleUnit) !== lineKey))
    }, [])

    return {
        lines,
        setLines,
        search,
        setSearch,
        scanning,
        searchRef,
        addProduct: addProductFlow,
        resolveAndAdd,
        updateQuantity,
        setQuantity,
        setUnitCost,
        setUnitSell,
        changeSaleUnit,
        removeLine,
    }
}
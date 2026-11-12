import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { Product } from '@/lib/api/query/products'
import type { StockReceipt } from '@/lib/api/query/stockReceipts'
import { fetchProductByCode, fetchProductDetail } from '@/lib/products/lookupProduct'
import {
    addProductToLines,
    linesFromApiItems,
    StockReceiptLine,
    stockReceiptLineKey,
} from '@/lib/stock-receipts/receiptLines'

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

    const addProduct = useCallback((product: Product) => {
        if (!product.id) return
        setLines((prev) => addProductToLines(prev, product, 1))
        setSearch('')
        searchRef.current?.focus()
    }, [])

    const addProductFlow = useCallback(
        async (product: Product) => {
            let detailProduct = product
            if (product.id) {
                try {
                    detailProduct = await fetchProductDetail(product.id)
                } catch {
                    detailProduct = product
                }
            }
            addProduct(detailProduct)
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
                await addProductFlow(product)
            } catch {
                toast.error(t('stockReceipts.messages.product_not_found'))
            } finally {
                setScanning(false)
            }
        },
        [addProductFlow, t],
    )

    const updateQuantity = useCallback((productId: string, delta: number) => {
        const key = stockReceiptLineKey(productId)
        setLines((prev) =>
            prev
                .map((l) => {
                    if (stockReceiptLineKey(l.product.id!) !== key) return l
                    const next = l.quantity + delta
                    if (next < 1) return null
                    return { ...l, quantity: next }
                })
                .filter((l): l is StockReceiptLine => l != null),
        )
    }, [])

    const setQuantity = useCallback((productId: string, quantity: number) => {
        const key = stockReceiptLineKey(productId)
        setLines((prev) =>
            prev.map((l) => (stockReceiptLineKey(l.product.id!) === key ? { ...l, quantity: Math.max(1, quantity) } : l)),
        )
    }, [])

    const setUnitCost = useCallback((productId: string, unit_cost: number) => {
        const key = stockReceiptLineKey(productId)
        setLines((prev) => prev.map((l) => (stockReceiptLineKey(l.product.id!) === key ? { ...l, unit_cost } : l)))
    }, [])

    const setUnitSell = useCallback((productId: string, unit_sell_price: number | undefined) => {
        const key = stockReceiptLineKey(productId)
        setLines((prev) => prev.map((l) => (stockReceiptLineKey(l.product.id!) === key ? { ...l, unit_sell_price } : l)))
    }, [])

    const removeLine = useCallback((productId: string) => {
        const key = stockReceiptLineKey(productId)
        setLines((prev) => prev.filter((l) => stockReceiptLineKey(l.product.id!) !== key))
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
        removeLine,
    }
}

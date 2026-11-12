import type { Product } from '@/lib/api/query/products'
import type { StockReceiptItem } from '@/lib/api/query/stockReceipts'

export type StockReceiptLine = {
    product: Product
    quantity: number
    unit_cost: number
    unit_sell_price?: number
}

export function stockReceiptLineKey(productId: string) {
    return productId
}

export function defaultCostSell(product: Product) {
    const unit_cost = product.cost_price != null ? Number(product.cost_price) : 0
    const unit_sell_price = product.price != null ? Number(product.price) : undefined
    return { unit_cost, unit_sell_price }
}

export function productStubFromReceiptItem(it: StockReceiptItem): Product {
    return {
        id: it.product_id,
        name: it.product_name,
        sku: it.product_sku ?? undefined,
        barcode: it.product_barcode ?? undefined,
        cost_price: it.product_cost_price,
        price: it.product_sell_price,
    } as Product
}

export function linesFromApiItems(items: StockReceiptItem[] | undefined): StockReceiptLine[] {
    return (items || []).map((it) => ({
        product: productStubFromReceiptItem(it),
        quantity: it.quantity,
        unit_cost: it.unit_cost,
        unit_sell_price: it.unit_sell_price,
    }))
}

export function addProductToLines(lines: StockReceiptLine[], product: Product, qty = 1): StockReceiptLine[] {
    const id = product.id!
    const key = stockReceiptLineKey(id)
    const existing = lines.find((l) => stockReceiptLineKey(l.product.id!) === key)
    if (existing) {
        return lines.map((l) =>
            stockReceiptLineKey(l.product.id!) === key ? { ...l, quantity: l.quantity + qty, product } : l,
        )
    }
    const { unit_cost, unit_sell_price } = defaultCostSell(product)
    return [...lines, { product, quantity: qty, unit_cost, unit_sell_price }]
}

export function linesToApiItems(lines: StockReceiptLine[]): StockReceiptItem[] {
    return lines
        .filter((l) => l.product.id && l.quantity > 0)
        .map((l) => ({
            product_id: l.product.id!,
            quantity: l.quantity,
            unit_cost: l.unit_cost,
            unit_sell_price:
                l.unit_sell_price !== undefined && l.unit_sell_price > 0 ? l.unit_sell_price : undefined,
        }))
}

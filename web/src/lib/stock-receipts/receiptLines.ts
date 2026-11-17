import type { Product } from '@/lib/api/query/products'
import type { StockReceiptItem } from '@/lib/api/query/stockReceipts'
import {
    cartLineKey,
    defaultSaleUnit,
    type ProductSaleUnit,
} from '@/lib/retail-pos/productUnits'

export type StockReceiptLine = {
    product: Product
    quantity: number
    saleUnit: ProductSaleUnit
    unit_cost: number
    unit_sell_price?: number
}

export function stockReceiptLineKey(productId: string, unit: ProductSaleUnit) {
    return cartLineKey(productId, undefined, unit)
}

export function defaultCostSell(product: Product, unit?: ProductSaleUnit) {
    const saleUnit = unit ?? defaultSaleUnit(product)
    const factor = saleUnit.factor_to_base > 0 ? saleUnit.factor_to_base : 1
    const baseCost = product.cost_price != null ? Number(product.cost_price) : 0
    const unit_cost = baseCost * factor
    const unit_sell_price =
        saleUnit.sell_price > 0
            ? saleUnit.sell_price
            : product.price != null
              ? Number(product.price) * factor
              : undefined
    return { unit_cost, unit_sell_price, saleUnit }
}

function saleUnitFromApiItem(it: StockReceiptItem): ProductSaleUnit {
    const factor = it.factor_to_base != null && it.factor_to_base > 0 ? it.factor_to_base : 1
    return {
        id: it.product_unit_id,
        name: it.sale_unit_name ?? 'pcs',
        is_base: factor === 1,
        factor_to_base: factor,
        sell_price: it.product_sell_price != null ? Number(it.product_sell_price) : 0,
        barcode: it.product_barcode ?? undefined,
        sku: it.product_sku ?? undefined,
    }
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
    return (items || []).map((it) => {
        const saleUnit = saleUnitFromApiItem(it)
        return {
            product: productStubFromReceiptItem(it),
            quantity: it.quantity,
            saleUnit,
            unit_cost: it.unit_cost,
            unit_sell_price: it.unit_sell_price,
        }
    })
}

export function addProductToLines(
    lines: StockReceiptLine[],
    product: Product,
    qty = 1,
    preferredUnitId?: string | null,
): StockReceiptLine[] {
    const id = product.id!
    const saleUnit = defaultSaleUnit(product, preferredUnitId ?? product.matched_sale_unit_id)
    const key = stockReceiptLineKey(id, saleUnit)
    const existing = lines.find((l) => stockReceiptLineKey(l.product.id!, l.saleUnit) === key)
    if (existing) {
        return lines.map((l) =>
            stockReceiptLineKey(l.product.id!, l.saleUnit) === key
                ? { ...l, quantity: l.quantity + qty, product, saleUnit }
                : l,
        )
    }
    const { unit_cost, unit_sell_price } = defaultCostSell(product, saleUnit)
    return [...lines, { product, quantity: qty, saleUnit, unit_cost, unit_sell_price }]
}

export function linesToApiItems(lines: StockReceiptLine[]): StockReceiptItem[] {
    return lines
        .filter((l) => l.product.id && l.quantity > 0)
        .map((l) => ({
            product_id: l.product.id!,
            product_unit_id: l.saleUnit.id || undefined,
            quantity: Math.max(1, Math.floor(Number(l.quantity) || 0)),
            unit_cost: l.unit_cost,
            unit_sell_price:
                l.unit_sell_price !== undefined && l.unit_sell_price > 0 ? l.unit_sell_price : undefined,
        }))
}
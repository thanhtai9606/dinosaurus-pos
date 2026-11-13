import { Product } from '@/lib/api/query/products'

export type ProductSaleUnit = {
    id?: string
    measurement_unit_id?: string
    measurement_unit_code?: string | null
    name: string
    is_base: boolean
    factor_to_base: number
    sell_price: number
    wholesale_price?: number
    barcode?: string | null
    sku?: string | null
    sort_order?: number
}

export function saleUnitsOf(product: Product & { sale_units?: ProductSaleUnit[] }): ProductSaleUnit[] {
    const units = product.sale_units
    if (units?.length) return units
    return [
        {
            name: product.unit || 'pcs',
            is_base: true,
            factor_to_base: 1,
            sell_price: product.price || 0,
            wholesale_price: 0,
            barcode: product.barcode,
            sku: product.sku,
            sort_order: 0,
        },
    ]
}

export function defaultSaleUnit(product: Product & { sale_units?: ProductSaleUnit[] }, preferredId?: string | null): ProductSaleUnit {
    const units = saleUnitsOf(product)
    if (preferredId) {
        const match = units.find((u) => u.id === preferredId)
        if (match) return match
    }
    return units.find((u) => u.is_base) ?? units[0]
}

export function baseQtyForLine(quantity: number, unit: ProductSaleUnit): number {
    const factor = unit.factor_to_base > 0 ? unit.factor_to_base : 1
    return Math.ceil(quantity * factor)
}

export function cartBaseQtyForProduct(
    cart: { product: Product; saleUnit?: ProductSaleUnit; quantity: number }[],
    productId: string,
    excludeKey?: string,
    lineKey?: (item: { product: Product; saleUnit?: ProductSaleUnit }) => string,
): number {
    const keyOf =
        lineKey ??
        ((item) => `${item.product.id}-${item.saleUnit?.id ?? 'base'}-${item.saleUnit?.name ?? item.product.unit}`)
    return cart.reduce((sum, item) => {
        if (item.product.id !== productId) return sum
        if (excludeKey && keyOf(item) === excludeKey) return sum
        const unit = item.saleUnit ?? defaultSaleUnit(item.product)
        return sum + baseQtyForLine(item.quantity, unit)
    }, 0)
}

export function cartLineKey(productId: string, variantId: string | undefined, unit: ProductSaleUnit): string {
    return `${productId}-${variantId ?? 'base'}-${unit.id ?? unit.name}`
}

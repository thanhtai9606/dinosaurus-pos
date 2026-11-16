import { CartItem } from '@/components/orders/CartContent'
import { defaultSaleUnit, type ProductSaleUnit } from '@/lib/retail-pos/productUnits'

export type PriceTier = 'retail' | 'wholesale'

export function catalogUnitPrice(item: CartItem, tier: PriceTier = 'retail'): number {
    const unit =
        item.saleUnit ??
        defaultSaleUnit(item.product as CartItem['product'] & { sale_units?: ProductSaleUnit[] })
    let price = unit.sell_price || item.product.price || 0
    if (tier === 'wholesale') {
        const wp = unit.wholesale_price ?? 0
        if (wp > 0) price = wp
    }
    return price + (item.variant?.additional_price || 0)
}

export function lineUnitPrice(item: CartItem, tier: PriceTier = 'retail'): number {
    return item.unitPrice ?? catalogUnitPrice(item, tier)
}

export function lineSubtotal(item: CartItem, tier: PriceTier = 'retail'): number {
    return lineUnitPrice(item, tier) * item.quantity
}

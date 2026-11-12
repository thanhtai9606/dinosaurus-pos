import { CartItem } from '@/components/orders/CartContent'
import { defaultSaleUnit, type ProductSaleUnit } from '@/lib/retail-pos/productUnits'

export function catalogUnitPrice(item: CartItem): number {
    const unit =
        item.saleUnit ??
        defaultSaleUnit(item.product as CartItem['product'] & { sale_units?: ProductSaleUnit[] })
    return (unit.sell_price || item.product.price || 0) + (item.variant?.additional_price || 0)
}

export function lineUnitPrice(item: CartItem): number {
    return item.unitPrice ?? catalogUnitPrice(item)
}

export function lineSubtotal(item: CartItem): number {
    return lineUnitPrice(item) * item.quantity
}

import { CartItem } from '@/components/orders/CartContent'

export function catalogUnitPrice(item: CartItem): number {
    return (item.product.price || 0) + (item.variant?.additional_price || 0)
}

export function lineUnitPrice(item: CartItem): number {
    return item.unitPrice ?? catalogUnitPrice(item)
}

export function lineSubtotal(item: CartItem): number {
    return lineUnitPrice(item) * item.quantity
}

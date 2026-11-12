export type OrderItemRow = {
    id?: string
    product_id?: string
    product_name?: string
    product_code?: string
    barcode?: string
    sku?: string
    sale_unit_name?: string
    quantity?: number
    price_at_sale?: number
    discount_amount?: number
    net_subtotal?: number
    line_total?: number
    subtotal?: number
    options?: Array<{ product_option_id?: string | number; option_name?: string }>
}

export function orderItemCode(item: OrderItemRow) {
    return item.product_code || item.barcode || item.sku || '—'
}

export function orderItemLineTotal(item: OrderItemRow) {
    if (item.net_subtotal != null) return item.net_subtotal
    if (item.subtotal != null) {
        const disc = item.discount_amount ?? 0
        return disc > 0 ? Math.max(0, item.subtotal - disc) : item.subtotal
    }
    return item.line_total ?? 0
}

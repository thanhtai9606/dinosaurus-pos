export type ProductCodeFields = {
    code?: string | null
    sku?: string | null
    barcode?: string | null
}

/** Display + search text for product list code / SKU / barcode. */
export function productListCodeSearchText(p: ProductCodeFields): string {
    return [p.code, p.barcode, p.sku].filter((v) => v && String(v).trim()).join(' ')
}

export function formatProductListCodes(p: ProductCodeFields): string {
    const parts: string[] = []
    if (p.code?.trim()) parts.push(p.code.trim())
    if (p.barcode?.trim()) parts.push(p.barcode.trim())
    else if (p.sku?.trim()) parts.push(p.sku.trim())
    return parts.length ? parts.join(' · ') : '—'
}
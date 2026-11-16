import type { Product } from '@/lib/api/query/products'
import type { ProductSaleUnit } from '@/lib/retail-pos/productUnits'

function norm(s: string | null | undefined) {
    return (s ?? '').trim().toLowerCase()
}

function unitBarcodes(units: ProductSaleUnit[] | undefined): { code: string; unitId?: string }[] {
    const out: { code: string; unitId?: string }[] = []
    for (const u of units ?? []) {
        const bc = u.barcode?.trim()
        const sku = u.sku?.trim()
        if (bc) out.push({ code: bc, unitId: u.id })
        if (sku && sku !== bc) out.push({ code: sku, unitId: u.id })
    }
    return out
}

/** Mirror server lookup: sale-unit barcode → product + matched_sale_unit_id. */
export function lookupProductInCatalog(products: Product[], rawCode: string): Product | null {
    const code = rawCode.trim()
    if (!code) return null

    for (const p of products) {
        for (const { code: c, unitId } of unitBarcodes(p.sale_units)) {
            if (c === code) {
                return { ...p, matched_sale_unit_id: unitId ?? p.matched_sale_unit_id }
            }
        }
    }

    const lower = code.toLowerCase()
    const exact = products.find((p) => {
        const bc = p.barcode?.trim()
        const sku = p.sku?.trim()
        const pCode = (p as { code?: string }).code?.trim()
        if (bc === code || sku === code || pCode === code) return true
        return norm(p.name) === lower
    })
    if (exact) return exact

    return null
}

export function searchProductsInCatalog(products: Product[], q: string, limit = 12): Product[] {
    const term = q.trim().toLowerCase()
    if (term.length < 2) return []
  const scored: { p: Product; rank: number }[] = []
    for (const p of products) {
        const name = norm(p.name)
        const bc = norm(p.barcode)
        const sku = norm(p.sku)
        const code = norm((p as { code?: string }).code)
        let rank = 0
        if (name.startsWith(term)) rank = 3
        else if (name.includes(term)) rank = 2
        else if (bc.includes(term) || sku.includes(term) || code.includes(term)) rank = 1
        else if ((p.sale_units ?? []).some((u) => norm(u.barcode).includes(term) || norm(u.sku).includes(term))) rank = 1
        if (rank > 0) scored.push({ p, rank })
    }
    scored.sort((a, b) => b.rank - a.rank || a.p.name!.localeCompare(b.p.name!))
    return scored.slice(0, limit).map((x) => x.p)
}
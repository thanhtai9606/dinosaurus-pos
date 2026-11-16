import type { Product } from '@/lib/api/query/products'
import { saleUnitsOf } from '@/lib/retail-pos/productUnits'

export function downloadProductsSpreadsheet(products: Product[], filename: string) {
    const headers = [
        'code',
        'name',
        'sku',
        'barcode',
        'unit',
        'retail_price',
        'wholesale_price',
        'stock',
        'categories',
    ]
    const rows: string[][] = [headers]

    for (const p of products) {
        const cats = (p.categories ?? []).map((c) => c.name).filter(Boolean).join('; ')
        const units = saleUnitsOf(p)
        if (units.length === 0) {
            rows.push([
                p.code || '',
                p.name || '',
                p.sku || '',
                p.barcode || '',
                p.unit || '',
                String(p.price ?? ''),
                '',
                String(p.stock ?? ''),
                cats,
            ])
            continue
        }
        for (const u of units) {
            rows.push([
                p.code || '',
                p.name || '',
                u.sku || p.sku || '',
                u.barcode || p.barcode || '',
                u.name || '',
                String(u.sell_price ?? p.price ?? ''),
                String(u.wholesale_price ?? ''),
                String(p.stock ?? ''),
                cats,
            ])
        }
    }

    const escape = (v: string) => {
        if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`
        return v
    }
    const body = rows.map((row) => row.map(escape).join(',')).join('\r\n')
    const blob = new Blob(['\ufeff' + body], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
    link.click()
    URL.revokeObjectURL(url)
}
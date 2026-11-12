import type { StockReceipt } from '@/lib/api/query/stockReceipts'

export function downloadStockReceiptsSpreadsheet(receipts: StockReceipt[], filename: string) {
    const headers = [
        'receipt_no',
        'supplier',
        'status',
        'product_name',
        'sku',
        'barcode',
        'quantity',
        'unit_cost',
        'line_total',
    ]
    const rows: string[][] = [headers]

    for (const r of receipts) {
        const supplier = r.supplier_name || ''
        const items = r.items?.length ? r.items : []
        if (items.length === 0) {
            rows.push([r.receipt_no, supplier, r.status, '', '', '', '', '', ''])
            continue
        }
        for (const it of items) {
            rows.push([
                r.receipt_no,
                supplier,
                r.status,
                it.product_name || '',
                it.product_sku || '',
                it.product_barcode || '',
                String(it.quantity),
                String(it.unit_cost),
                String(it.line_total ?? it.quantity * it.unit_cost),
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

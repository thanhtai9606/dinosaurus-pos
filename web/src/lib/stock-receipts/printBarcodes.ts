import JsBarcode from 'jsbarcode'
import type { StockReceipt } from '@/lib/api/query/stockReceipts'

function barcodeSvg(code: string): string {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    try {
        JsBarcode(svg, code, {
            format: 'CODE128',
            width: 2,
            height: 56,
            displayValue: true,
            fontSize: 13,
            margin: 6,
        })
    } catch {
        return ''
    }
    return svg.outerHTML
}

export function printStockReceiptBarcodes(receipts: StockReceipt[], receiptNoLabel: string) {
    const pages: string[] = []

    for (const receipt of receipts) {
        for (const item of receipt.items || []) {
            const code = item.product_barcode?.trim() || item.product_sku?.trim() || ''
            if (!code) continue
            const qty = Math.max(1, item.quantity)
            const svg = barcodeSvg(code)
            if (!svg) continue
            for (let i = 0; i < qty; i++) {
                pages.push(`
          <div class="label">
            <div class="name">${escapeHtml(item.product_name || '')}</div>
            ${svg}
            <div class="meta">${escapeHtml(receiptNoLabel)}: ${escapeHtml(receipt.receipt_no)}</div>
          </div>`)
            }
        }
    }

    if (pages.length === 0) {
        throw new Error('NO_PRINTABLE_BARCODES')
    }

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Barcode</title>
<style>
  @page { size: 50mm 30mm; margin: 2mm; }
  body { margin: 0; font-family: system-ui, sans-serif; }
  .label { page-break-after: always; text-align: center; padding: 2mm; }
  .name { font-size: 9px; font-weight: 600; margin-bottom: 2px; line-height: 1.2; max-height: 2.4em; overflow: hidden; }
  .meta { font-size: 8px; color: #444; margin-top: 2px; }
  svg { max-width: 100%; height: auto; }
</style></head><body>
${pages.join('\n')}
<script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); }</script>
</body></html>`

    const w = window.open('', '_blank')
    if (!w) throw new Error('POPUP_BLOCKED')
    w.document.write(html)
    w.document.close()
}

function escapeHtml(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

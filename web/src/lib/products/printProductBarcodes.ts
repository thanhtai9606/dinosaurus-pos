import JsBarcode from 'jsbarcode'
import type { Product } from '@/lib/api/query/products'
import { saleUnitsOf } from '@/lib/retail-pos/productUnits'

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

function escapeHtml(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** One label per sale unit (or product-level barcode/SKU when no units). */
export function printProductBarcodes(products: Product[]) {
    const pages: string[] = []

    for (const product of products) {
        const units = saleUnitsOf(product)
        for (const unit of units) {
            const code = unit.barcode?.trim() || unit.sku?.trim() || ''
            if (!code) continue
            const svg = barcodeSvg(code)
            if (!svg) continue
            const unitLine =
                unit.is_base || !unit.name
                    ? ''
                    : `<div class="unit">${escapeHtml(unit.name)}</div>`
            pages.push(`
          <div class="label">
            <div class="name">${escapeHtml(product.name || '')}</div>
            ${unitLine}
            ${svg}
          </div>`)
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
  .unit { font-size: 8px; color: #555; margin-bottom: 2px; }
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
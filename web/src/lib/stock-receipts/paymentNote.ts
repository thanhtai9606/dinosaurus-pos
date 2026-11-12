export type StockReceiptPaymentMode = 'cash' | 'credit'

export type StockReceiptPaymentMeta = {
    mode: StockReceiptPaymentMode
    amount_paid: number
}

const MARKER = '\n__payment__:'

export function embedPaymentInNote(note: string, meta: StockReceiptPaymentMeta): string {
    const text = stripPaymentFromNote(note).text.trim()
    const payload = JSON.stringify(meta)
    return text ? `${text}${MARKER}${payload}` : `${MARKER}${payload}`
}

export function stripPaymentFromNote(note: string | null | undefined): { text: string; meta?: StockReceiptPaymentMeta } {
    const raw = note ?? ''
    const idx = raw.indexOf(MARKER)
    if (idx < 0) return { text: raw }
    const text = raw.slice(0, idx)
    try {
        const meta = JSON.parse(raw.slice(idx + MARKER.length)) as StockReceiptPaymentMeta
        return { text, meta }
    } catch {
        return { text: raw }
    }
}

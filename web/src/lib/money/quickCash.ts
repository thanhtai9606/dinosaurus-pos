/** Fallback when financial settings are not loaded (matches VN market preset). */
export const FALLBACK_POS_QUICK_CASH = {
    retail: [10_000, 20_000, 50_000, 100_000, 200_000],
    stock_receipt: [100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000],
} as const

export type PosQuickCashSettings = {
    retail: number[]
    stock_receipt: number[]
}

export function formatQuickCashAmountList(amounts: number[]): string {
    return amounts.join(', ')
}

export function parseQuickCashAmountList(input: string): number[] {
    const parts = input.split(/[,;\s]+/).map((p) => p.trim()).filter(Boolean)
    const seen = new Set<number>()
    const out: number[] = []
    for (const p of parts) {
        const n = Number(p.replace(/_/g, ''))
        if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) continue
        if (seen.has(n)) continue
        seen.add(n)
        out.push(n)
    }
    out.sort((a, b) => a - b)
    return out
}

/** Short label for quick-cash chip (VND-style k/tr; USD-style when fraction_digits > 0). */
export function formatQuickCashLabel(amount: number, currencyCode?: string, fractionDigits = 0): string {
    const code = (currencyCode ?? 'VND').toUpperCase()
    if (fractionDigits > 0 || code === 'USD') {
        const major = amount / Math.pow(10, fractionDigits || 2)
        if (major >= 1_000_000) return `${major / 1_000_000}M`
        if (major >= 1_000) return `${major / 1_000}k`
        return String(major)
    }
    if (amount >= 1_000_000) return `${amount / 1_000_000}tr`
    if (amount >= 1_000) return `${amount / 1_000}k`
    return String(amount)
}
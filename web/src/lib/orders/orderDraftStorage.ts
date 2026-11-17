import type { CartItem } from '@/components/orders/CartContent'
import type { OrderType } from '@/lib/api/domain'
import { posStorageScope } from '@/lib/pos/sessionScope'

const KEY_PREFIX = 'order_pos_draft_v1'

export type OrderPosDraftSnapshot = {
    version: 1
    savedAt: number
    cart: CartItem[]
    selectedCustomerId: string | null
    selectedOrderType: OrderType
    selectedDiningTableId?: string | null
}

function storageKey(scope = posStorageScope()) {
    return `${KEY_PREFIX}_${scope}`
}

export function saveOrderPosDraft(snapshot: OrderPosDraftSnapshot, scope = posStorageScope()) {
    try {
        localStorage.setItem(storageKey(scope), JSON.stringify(snapshot))
    } catch {
        /* quota */
    }
}

export function loadOrderPosDraft(scope = posStorageScope()): OrderPosDraftSnapshot | null {
    try {
        const raw = localStorage.getItem(storageKey(scope))
        if (!raw) return null
        const parsed = JSON.parse(raw) as OrderPosDraftSnapshot
        if (parsed?.version !== 1 || !Array.isArray(parsed.cart)) return null
        return parsed
    } catch {
        return null
    }
}

export function clearOrderPosDraft(scope = posStorageScope()) {
    try {
        localStorage.removeItem(storageKey(scope))
    } catch {
        /* ignore */
    }
}

export function orderDraftLineCount(scope = posStorageScope()): number {
    const draft = loadOrderPosDraft(scope)
    if (!draft?.cart.length) return 0
    return draft.cart.reduce((n, line) => n + line.quantity, 0)
}
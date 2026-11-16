import type { RetailSaleTab } from '@/lib/retail-pos/saleTabs'
import { posStorageScope } from '@/lib/pos/sessionScope'

const KEY_PREFIX = 'retail_pos_draft_v1'

export type RetailPosDraftSnapshot = {
    version: 1
    savedAt: number
    activeTabId: string
    tabs: RetailSaleTab[]
}

function storageKey(scope = posStorageScope()) {
    return `${KEY_PREFIX}_${scope}`
}

export function saveRetailPosDraft(snapshot: RetailPosDraftSnapshot, scope = posStorageScope()) {
    try {
        localStorage.setItem(storageKey(scope), JSON.stringify(snapshot))
    } catch {
        /* quota */
    }
}

export function loadRetailPosDraft(scope = posStorageScope()): RetailPosDraftSnapshot | null {
    try {
        const raw = localStorage.getItem(storageKey(scope))
        if (!raw) return null
        const parsed = JSON.parse(raw) as RetailPosDraftSnapshot
        if (parsed?.version !== 1 || !Array.isArray(parsed.tabs)) return null
        return parsed
    } catch {
        return null
    }
}

export function clearRetailPosDraft(scope = posStorageScope()) {
    try {
        localStorage.removeItem(storageKey(scope))
    } catch {
        /* ignore */
    }
}

export function retailDraftTabCount(scope = posStorageScope()): number {
    const draft = loadRetailPosDraft(scope)
    if (!draft) return 0
    return draft.tabs.filter((tab) => tab.cart.length > 0).length
}

export function hasRestorableRetailDraft(scope = posStorageScope()): boolean {
    return retailDraftTabCount(scope) > 0
}
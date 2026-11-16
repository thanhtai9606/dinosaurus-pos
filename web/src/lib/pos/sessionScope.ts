const SCOPE_KEY = 'pos_storage_scope_v1'
export const POS_QUEUE_CHANGED_EVENT = 'pos-offline-queue-changed'
export const POS_DRAFT_CHANGED_EVENT = 'pos-draft-changed'
export const POS_CATALOG_CHANGED_EVENT = 'pos-catalog-changed'

export function setPosStorageScope(scope: string) {
    const next = scope.trim() || 'default'
    try {
        const prev = sessionStorage.getItem(SCOPE_KEY)
        if (prev === next) return
        sessionStorage.setItem(SCOPE_KEY, next)
    } catch {
        /* ignore */
    }
}

export function posStorageScope(): string {
    try {
        return sessionStorage.getItem(SCOPE_KEY) || 'default'
    } catch {
        return 'default'
    }
}

export function notifyPosQueueChanged() {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new Event(POS_QUEUE_CHANGED_EVENT))
}

export function notifyPosDraftChanged() {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new Event(POS_DRAFT_CHANGED_EVENT))
}

export function notifyPosCatalogChanged() {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new Event(POS_CATALOG_CHANGED_EVENT))
}
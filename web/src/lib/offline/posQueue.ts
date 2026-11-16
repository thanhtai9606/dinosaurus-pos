import { notifyPosQueueChanged, posStorageScope } from '@/lib/pos/sessionScope'

const LEGACY_KEY = 'pos_offline_queue_v1'

function storageKey() {
    return `${LEGACY_KEY}_${posStorageScope()}`
}

export type PosQueueKind = 'retail_cash' | 'retail_debt' | 'retail_other' | 'pos_cash' | 'pos_debt'

export type PosQueueEntry = {
    id: string
    idempotencyKey: string
    createdAt: number
    kind: PosQueueKind
    orderBody: Record<string, unknown>
    payment?: {
        payment_method_id: number
        cash_received: number
    }
}

function read(): PosQueueEntry[] {
    try {
        const key = storageKey()
        let raw = localStorage.getItem(key)
        if (!raw && posStorageScope() === 'default') {
            raw = localStorage.getItem(LEGACY_KEY)
            if (raw) {
                localStorage.setItem(key, raw)
                localStorage.removeItem(LEGACY_KEY)
            }
        }
        if (!raw) return []
        return JSON.parse(raw) as PosQueueEntry[]
    } catch {
        return []
    }
}

function write(entries: PosQueueEntry[]) {
    localStorage.setItem(storageKey(), JSON.stringify(entries))
    notifyPosQueueChanged()
}

export function posQueueCount(): number {
    return read().length
}

export function enqueuePosOp(entry: Omit<PosQueueEntry, 'id' | 'createdAt'> & { id?: string }) {
    const list = read()
    const item: PosQueueEntry = {
        id: entry.id ?? crypto.randomUUID(),
        createdAt: Date.now(),
        idempotencyKey: entry.idempotencyKey,
        kind: entry.kind,
        orderBody: entry.orderBody,
        payment: entry.payment,
    }
    list.push(item)
    write(list)
    return item
}

export function listPosQueue(): PosQueueEntry[] {
    return read().sort((a, b) => a.createdAt - b.createdAt)
}

export function removePosQueueEntry(id: string) {
    write(read().filter((e) => e.id !== id))
}

export function isNetworkError(err: unknown): boolean {
    if (!err || typeof err !== 'object') return false
    const ax = err as { code?: string; message?: string; response?: unknown }
    if (ax.code === 'ERR_NETWORK' || ax.message === 'Network Error') return true
    return ax.response === undefined && !!ax.message
}

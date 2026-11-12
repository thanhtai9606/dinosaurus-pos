const STORAGE_KEY = 'pos_offline_queue_v1'

export type PosQueueKind = 'retail_cash' | 'retail_debt' | 'retail_other'

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
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return []
        return JSON.parse(raw) as PosQueueEntry[]
    } catch {
        return []
    }
}

function write(entries: PosQueueEntry[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
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

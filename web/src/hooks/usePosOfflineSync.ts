import { useCallback, useEffect, useState } from 'react'
import { axiosInstance } from '@/lib/api/client'
import { listPosQueue, posQueueCount, removePosQueueEntry, type PosQueueEntry } from '@/lib/offline/posQueue'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function usePosOfflineSync() {
    const { t } = useTranslation()
    const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
    const [pending, setPending] = useState(posQueueCount())
    const [syncing, setSyncing] = useState(false)

    const refresh = useCallback(() => setPending(posQueueCount()), [])

    const flush = useCallback(async () => {
        if (syncing || !navigator.onLine) return
        const queue = listPosQueue()
        if (!queue.length) return
        setSyncing(true)
        let done = 0
        for (const entry of queue) {
            try {
                await processEntry(entry)
                removePosQueueEntry(entry.id)
                done++
            } catch {
                break
            }
        }
        refresh()
        setSyncing(false)
        if (done > 0) {
            toast.success(t('retailPos.offline.synced', { count: done }))
        }
    }, [refresh, syncing, t])

    useEffect(() => {
        const on = () => {
            setOnline(true)
            void flush()
        }
        const off = () => setOnline(false)
        window.addEventListener('online', on)
        window.addEventListener('offline', off)
        return () => {
            window.removeEventListener('online', on)
            window.removeEventListener('offline', off)
        }
    }, [flush])

    useEffect(() => {
        refresh()
    }, [refresh])

    return { online, pending, syncing, refresh, flush }
}

async function processEntry(entry: PosQueueEntry) {
    const orderRes = await axiosInstance.post('/orders', entry.orderBody, {
        headers: { 'X-Idempotency-Key': entry.idempotencyKey },
    })
    const order = (orderRes.data as { data: { id?: string; version?: number } }).data
    if (entry.kind === 'retail_debt' || !entry.payment) {
        return
    }
    if (!order?.id) throw new Error('no order id')
    await axiosInstance.post(
        `/orders/${order.id}/pay/manual`,
        {
            payment_method_id: entry.payment.payment_method_id,
            cash_received: entry.payment.cash_received,
            version: order.version ?? 1,
        },
        { headers: { 'X-Idempotency-Key': `${entry.idempotencyKey}-pay` } },
    )
}

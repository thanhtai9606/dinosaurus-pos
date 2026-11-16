import { useCallback, useEffect, useState } from 'react'
import { posQueueCount } from '@/lib/offline/posQueue'
import { retailDraftTabCount } from '@/lib/retail-pos/draftStorage'
import { orderDraftLineCount } from '@/lib/orders/orderDraftStorage'
import { POS_DRAFT_CHANGED_EVENT, POS_QUEUE_CHANGED_EVENT } from '@/lib/pos/sessionScope'

export function usePosStatusSummary() {
    const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

    const refresh = useCallback(() => {
        setPendingSync(posQueueCount())
        setDraftTabs(retailDraftTabCount())
        setOrderDraftLines(orderDraftLineCount())
    }, [])

    const [pendingSync, setPendingSync] = useState(() => posQueueCount())
    const [draftTabs, setDraftTabs] = useState(() => retailDraftTabCount())
    const [orderDraftLines, setOrderDraftLines] = useState(() => orderDraftLineCount())

    useEffect(() => {
        refresh()
        const onQueue = () => refresh()
        const onDraft = () => refresh()
        window.addEventListener(POS_QUEUE_CHANGED_EVENT, onQueue)
        window.addEventListener(POS_DRAFT_CHANGED_EVENT, onDraft)
        const onOnline = () => {
            setOnline(true)
            refresh()
        }
        const onOffline = () => setOnline(false)
        window.addEventListener('online', onOnline)
        window.addEventListener('offline', onOffline)
        return () => {
            window.removeEventListener(POS_QUEUE_CHANGED_EVENT, onQueue)
            window.removeEventListener(POS_DRAFT_CHANGED_EVENT, onDraft)
            window.removeEventListener('online', onOnline)
            window.removeEventListener('offline', onOffline)
        }
    }, [refresh])

    const hasDrafts = draftTabs > 0 || orderDraftLines > 0

    return {
        online,
        pendingSync,
        draftTabs,
        orderDraftLines,
        hasDrafts,
        refresh,
        visible: !online || pendingSync > 0 || hasDrafts,
    }
}
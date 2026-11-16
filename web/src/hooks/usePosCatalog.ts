import { useCallback, useEffect, useState } from 'react'
import {
    getPosCatalogSnapshot,
    isPosCatalogStale,
    posCatalogProductCount,
    subscribePosCatalog,
} from '@/lib/pos/posCatalogStore'
import { syncPosProductCatalog } from '@/lib/pos/posCatalogSync'

export function usePosCatalog() {
    const [count, setCount] = useState(0)
    const [updatedAt, setUpdatedAt] = useState<number | null>(null)
    const [stale, setStale] = useState(true)
    const [syncing, setSyncing] = useState(false)

    const refresh = useCallback(async () => {
        const snap = await getPosCatalogSnapshot()
        setCount(posCatalogProductCount(snap))
        setUpdatedAt(snap?.updatedAt ?? null)
        setStale(isPosCatalogStale(snap))
    }, [])

    const sync = useCallback(async () => {
        if (syncing || (typeof navigator !== 'undefined' && !navigator.onLine)) return null
        setSyncing(true)
        try {
            const snap = await syncPosProductCatalog()
            setCount(snap.products.length)
            setUpdatedAt(snap.updatedAt)
            setStale(false)
            return snap
        } finally {
            setSyncing(false)
        }
    }, [syncing])

    useEffect(() => {
        void refresh()
        return subscribePosCatalog(() => {
            void refresh()
        })
    }, [refresh])

    return { count, updatedAt, stale, syncing, refresh, sync }
}
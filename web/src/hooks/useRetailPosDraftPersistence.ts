import { useEffect, useRef } from 'react'
import type { RetailSaleTab } from '@/lib/retail-pos/saleTabs'
import {
    clearRetailPosDraft,
    loadRetailPosDraft,
    saveRetailPosDraft,
} from '@/lib/retail-pos/draftStorage'
import { notifyPosDraftChanged, posStorageScope } from '@/lib/pos/sessionScope'

export function loadRetailPosInitialState(): {
    tabs: RetailSaleTab[]
    activeTabId: string
    restoredFromDraft: boolean
} {
    const draft = loadRetailPosDraft()
    if (draft?.tabs?.length) {
        const active =
            draft.tabs.some((t) => t.id === draft.activeTabId) ? draft.activeTabId : draft.tabs[0]!.id
        const restoredFromDraft = draft.tabs.some((t) => t.cart.length > 0)
        return { tabs: draft.tabs, activeTabId: active, restoredFromDraft }
    }
    return { tabs: [], activeTabId: '', restoredFromDraft: false }
}

export function useRetailPosDraftPersistence(
    tabs: RetailSaleTab[],
    activeTabId: string,
    enabled = true,
) {
    const firstSkip = useRef(true)

    useEffect(() => {
        if (!enabled) return
        if (firstSkip.current) {
            firstSkip.current = false
            return
        }
        const scope = posStorageScope()
        const hasItems = tabs.some((t) => t.cart.length > 0)
        if (!hasItems) {
            clearRetailPosDraft(scope)
            notifyPosDraftChanged()
            return
        }
        saveRetailPosDraft({
            version: 1,
            savedAt: Date.now(),
            activeTabId,
            tabs,
        }, scope)
        notifyPosDraftChanged()
    }, [tabs, activeTabId, enabled])
}
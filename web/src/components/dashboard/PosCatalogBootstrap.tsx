import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useSessionTenant } from '@/hooks/useSessionTenant'
import { setPosStorageScope } from '@/lib/pos/sessionScope'
import { getPosCatalogSnapshot, isPosCatalogStale } from '@/lib/pos/posCatalogStore'
import { syncPosProductCatalog } from '@/lib/pos/posCatalogSync'

/**
 * When online, keep a full product catalog on device (IndexedDB) for offline scan/search.
 */
export function PosCatalogBootstrap() {
    const { t } = useTranslation()
    const { tenant } = useSessionTenant()
    const busy = useRef(false)

    useEffect(() => {
        const scope = String(tenant?.code || tenant?.id || 'default')
        setPosStorageScope(scope)
    }, [tenant?.code, tenant?.id])

    useEffect(() => {
        if (typeof navigator === 'undefined' || !navigator.onLine) return
        if (busy.current) return

        const run = async () => {
            busy.current = true
            try {
                const snap = await getPosCatalogSnapshot()
                if (snap?.products.length && !isPosCatalogStale(snap)) return
                if (!snap?.products.length) {
                    toast.info(t('posCatalog.sync_starting'))
                }
                await syncPosProductCatalog()
                if (!snap?.products.length) {
                    toast.success(t('posCatalog.sync_done'))
                }
            } catch {
                if (!(await getPosCatalogSnapshot())?.products.length) {
                    toast.error(t('posCatalog.sync_failed'))
                }
            } finally {
                busy.current = false
            }
        }

        const id = window.setTimeout(() => void run(), 1500)
        return () => window.clearTimeout(id)
    }, [t, tenant?.code, tenant?.id])

    return null
}
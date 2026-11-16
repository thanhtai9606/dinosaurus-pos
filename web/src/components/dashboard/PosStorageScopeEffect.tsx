import { useEffect } from 'react'
import { useSessionTenant } from '@/hooks/useSessionTenant'
import { setPosStorageScope } from '@/lib/pos/sessionScope'

/** Binds offline queue + POS drafts to the logged-in store (tenant). */
export function PosStorageScopeEffect() {
    const { tenant } = useSessionTenant()

    useEffect(() => {
        const scope = tenant?.code || tenant?.id || 'default'
        setPosStorageScope(String(scope))
    }, [tenant?.code, tenant?.id])

    return null
}
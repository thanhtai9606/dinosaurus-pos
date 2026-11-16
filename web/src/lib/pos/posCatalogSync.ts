import type { Product } from '@/lib/api/query/products'
import { productsApi } from '@/lib/api/client'
import { fetchProductDetail } from '@/lib/products/lookupProduct'
import { posStorageScope, notifyPosCatalogChanged } from '@/lib/pos/sessionScope'
import { writePosCatalog, type PosCatalogSnapshot } from '@/lib/pos/posCatalogDb'
import { invalidatePosCatalogMemory } from '@/lib/pos/posCatalogStore'

type SyncOpts = {
    scope?: string
    onProgress?: (done: number, total: number) => void
}

export async function syncPosProductCatalog(opts?: SyncOpts): Promise<PosCatalogSnapshot> {
    const scope = opts?.scope ?? posStorageScope()
    const ids: string[] = []
    let page = 1
    let lastPage = 1

    do {
        const res = await productsApi.productsGet(page, 100, undefined, undefined)
        const body = (res.data as { data?: { products?: Product[]; pagination?: { last_page?: number } } }).data
        const list = body?.products ?? []
        for (const p of list) {
            if (p.id) ids.push(p.id)
        }
        lastPage = body?.pagination?.last_page ?? page
        page++
    } while (page <= lastPage)

    const unique = [...new Set(ids)]
    const products: Product[] = []
    const concurrency = 6

    for (let i = 0; i < unique.length; i += concurrency) {
        const batch = unique.slice(i, i + concurrency)
        const chunk = await Promise.all(batch.map((id) => fetchProductDetail(id).catch(() => null)))
        for (const p of chunk) {
            if (p) products.push(p)
        }
        opts?.onProgress?.(products.length, unique.length)
    }

    const snapshot: PosCatalogSnapshot = {
        scope,
        updatedAt: Date.now(),
        products,
    }
    await writePosCatalog(snapshot)
    invalidatePosCatalogMemory()
    notifyPosCatalogChanged()
    return snapshot
}
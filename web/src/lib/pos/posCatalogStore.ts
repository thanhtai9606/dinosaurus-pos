import type { Product } from '@/lib/api/query/products'
import { posStorageScope, POS_CATALOG_CHANGED_EVENT } from '@/lib/pos/sessionScope'
import { readPosCatalog, type PosCatalogSnapshot } from '@/lib/pos/posCatalogDb'
import { lookupProductInCatalog, searchProductsInCatalog } from '@/lib/pos/posCatalogLookup'

const memory: { scope: string; snapshot: PosCatalogSnapshot | null } = {
    scope: '',
    snapshot: null,
}

export const POS_CATALOG_STALE_MS = 12 * 60 * 60 * 1000

export async function getPosCatalogSnapshot(): Promise<PosCatalogSnapshot | null> {
    const scope = posStorageScope()
    if (memory.scope === scope && memory.snapshot) return memory.snapshot
    const snap = await readPosCatalog(scope)
    memory.scope = scope
    memory.snapshot = snap
    return snap
}

export async function getCachedPosProducts(): Promise<Product[]> {
    const snap = await getPosCatalogSnapshot()
    return snap?.products ?? []
}

export function posCatalogProductCount(snapshot: PosCatalogSnapshot | null): number {
    return snapshot?.products?.length ?? 0
}

export function isPosCatalogStale(snapshot: PosCatalogSnapshot | null): boolean {
    if (!snapshot?.products.length) return true
    return Date.now() - snapshot.updatedAt > POS_CATALOG_STALE_MS
}

export async function lookupProductOffline(code: string): Promise<Product | null> {
    const products = await getCachedPosProducts()
    return lookupProductInCatalog(products, code)
}

export async function searchProductsOffline(q: string, limit = 12): Promise<Product[]> {
    const products = await getCachedPosProducts()
    return searchProductsInCatalog(products, q, limit)
}

export async function getProductFromCache(id: string): Promise<Product | null> {
    const products = await getCachedPosProducts()
    return products.find((p) => p.id === id) ?? null
}

export function invalidatePosCatalogMemory() {
    memory.snapshot = null
}

export function subscribePosCatalog(cb: () => void) {
    const handler = () => cb()
    window.addEventListener(POS_CATALOG_CHANGED_EVENT, handler)
    return () => window.removeEventListener(POS_CATALOG_CHANGED_EVENT, handler)
}
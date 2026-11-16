import { axiosInstance } from '@/lib/api/client'
import type { Product } from '@/lib/api/query/products'
import { isNetworkError } from '@/lib/offline/posQueue'
import { getProductFromCache, lookupProductOffline } from '@/lib/pos/posCatalogStore'

export async function fetchProductByCode(code: string): Promise<Product> {
    const tryOffline = async (): Promise<Product | null> => lookupProductOffline(code)

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const hit = await tryOffline()
        if (hit) return hit
        throw new Error('not_found')
    }

    try {
        const res = await axiosInstance.get('/products/lookup', { params: { code } })
        return (res.data as { data: Product }).data
    } catch (err: unknown) {
        if (isNetworkError(err)) {
            const hit = await tryOffline()
            if (hit) return hit
            throw err
        }
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status !== 404) throw err
    }
    try {
        const list = await axiosInstance.get('/products/search', { params: { q: code, limit: 12 } })
        const products = ((list.data as { data?: { products?: Product[] } }).data?.products ?? []) as Product[]
        const exact = products.find(
            (p) => p.barcode === code || p.sku === code || p.name?.toLowerCase() === code.toLowerCase(),
        )
        if (exact) return exact
        if (products.length === 1) return products[0]
    } catch (err) {
        if (isNetworkError(err)) {
            const hit = await tryOffline()
            if (hit) return hit
        }
        throw err
    }
    throw new Error('not_found')
}

export async function fetchProductDetail(id: string): Promise<Product> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const cached = await getProductFromCache(id)
        if (cached) return cached
        throw new Error('offline_no_detail')
    }
    try {
        const res = await axiosInstance.get(`/products/${id}`)
        return (res.data as { data: Product }).data
    } catch (err) {
        if (isNetworkError(err)) {
            const cached = await getProductFromCache(id)
            if (cached) return cached
        }
        throw err
    }
}

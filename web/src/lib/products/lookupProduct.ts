import { axiosInstance } from '@/lib/api/client'
import type { Product } from '@/lib/api/query/products'

export async function fetchProductByCode(code: string): Promise<Product> {
    try {
        const res = await axiosInstance.get('/products/lookup', { params: { code } })
        return (res.data as { data: Product }).data
    } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status !== 404) throw err
    }
    const list = await axiosInstance.get('/products/search', { params: { q: code, limit: 12 } })
    const products = ((list.data as { data?: { products?: Product[] } }).data?.products ?? []) as Product[]
    const exact = products.find(
        (p) => p.barcode === code || p.sku === code || p.name?.toLowerCase() === code.toLowerCase(),
    )
    if (exact) return exact
    if (products.length === 1) return products[0]
    throw new Error('not_found')
}

export async function fetchProductDetail(id: string): Promise<Product> {
    const res = await axiosInstance.get(`/products/${id}`)
    return (res.data as { data: Product }).data
}

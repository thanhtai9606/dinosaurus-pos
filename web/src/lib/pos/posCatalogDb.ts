import type { Product } from '@/lib/api/query/products'

const DB_NAME = 'dinosaurus_pos_v1'
const STORE = 'pos_catalog'

export type PosCatalogSnapshot = {
    scope: string
    updatedAt: number
    products: Product[]
}

function catalogKey(scope: string) {
    return `catalog_${scope}`
}

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('NO_INDEXEDDB'))
            return
        }
        const req = indexedDB.open(DB_NAME, 1)
        req.onupgradeneeded = () => {
            const db = req.result
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE)
            }
        }
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error ?? new Error('idb_open_failed'))
    })
}

export async function readPosCatalog(scope: string): Promise<PosCatalogSnapshot | null> {
    try {
        const db = await openDb()
        return await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, 'readonly')
            const req = tx.objectStore(STORE).get(catalogKey(scope))
            req.onsuccess = () => {
                const val = req.result as PosCatalogSnapshot | undefined
                resolve(val?.scope === scope ? val : null)
            }
            req.onerror = () => reject(req.error)
        })
    } catch {
        return null
    }
}

export async function writePosCatalog(snapshot: PosCatalogSnapshot): Promise<void> {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).put(snapshot, catalogKey(snapshot.scope))
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
    })
}
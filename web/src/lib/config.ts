export const API_BASE = (import.meta.env.VITE_API_BASE as string) ?? '/api/v1'

export function buildUrl(path: string) {
    const base = API_BASE.replace(/\/$/, '')
    return base ? `${base}${path.startsWith('/') ? path : `/${path}`}` : path
}

/** WebSocket URL aligned with axios base (same-origin in dev via Vite proxy). */
export function buildWebSocketUrl(): string {
    const base = API_BASE.replace(/\/$/, '') || '/api/v1'
    if (/^https?:\/\//i.test(base)) {
        return base.replace(/^http/i, 'ws') + '/ws'
    }
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const path = base.startsWith('/') ? base : `/${base}`
    return `${proto}//${window.location.host}${path}/ws`
}

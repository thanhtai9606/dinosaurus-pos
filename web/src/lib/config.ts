export const API_BASE = (import.meta.env.VITE_API_BASE as string) ?? '/api/v1'

export function buildUrl(path: string) {
    const base = API_BASE.replace(/\/$/, '')
    return base ? `${base}${path.startsWith('/') ? path : `/${path}`}` : path
}

/** WebSocket URL aligned with axios base (same-origin in prod; direct API in dev). */
export function buildWebSocketUrl(): string {
    const envWs = import.meta.env.VITE_WS_URL as string | undefined
    if (envWs?.trim()) {
        return envWs.trim()
    }

    const base = API_BASE.replace(/\/$/, '') || '/api/v1'

    // Dev: hit the Go server directly so cookies (host-only) still apply and we avoid Vite WS proxy glitches.
    if (import.meta.env.DEV && base.startsWith('/')) {
        const apiPort = (import.meta.env.VITE_API_PORT as string | undefined)?.trim() || '8080'
        const host = window.location.hostname || 'localhost'
        return `ws://${host}:${apiPort}${base}/ws`
    }

    if (/^https?:\/\//i.test(base)) {
        return base.replace(/^http/i, 'ws') + '/ws'
    }
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const path = base.startsWith('/') ? base : `/${base}`
    return `${proto}//${window.location.host}${path}/ws`
}

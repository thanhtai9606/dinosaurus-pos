import type { AxiosError } from 'axios'

export function httpStatus(error: unknown): number | undefined {
    const e = error as AxiosError & { status?: number }
    return e.response?.status ?? e.status
}

/** Session invalid: unauthorized, forbidden, or profile missing after DB reset. */
export function isAuthSessionError(error: unknown): boolean {
    const status = httpStatus(error)
    if (status === 401 || status === 403) return true
    if (status === 404) {
        const url = (error as AxiosError)?.config?.url ?? ''
        return url.includes('/auth/me')
    }
    return false
}
import type { AxiosError } from 'axios'

type ErrorBody = {
    message?: string
    error?: string
    data?: { errors?: Record<string, string> }
}

/** Best-effort API error text for toasts (message, error, or validation fields). */
export function getApiErrorMessage(err: unknown, fallback: string): string {
    const ax = err as AxiosError<ErrorBody>
    const body = ax.response?.data
    if (!body) {
        return ax.message || fallback
    }
    if (body.message && body.message !== 'Invalid request body') {
        return body.message
    }
    const fieldMsgs = body.data?.errors
    if (fieldMsgs && Object.keys(fieldMsgs).length > 0) {
        return Object.entries(fieldMsgs)
            .map(([k, v]) => `${k}: ${v}`)
            .join('; ')
    }
    if (body.error) return String(body.error)
    if (body.message) return body.message
    return fallback
}
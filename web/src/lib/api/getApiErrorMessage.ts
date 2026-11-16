import type { AxiosError } from 'axios'
import type { ApiErrorBody } from '@/lib/api/domain'

export function getApiErrorMessage(error: unknown, fallback: string): string {
    const ax = error as AxiosError<ApiErrorBody>
    const data = ax.response?.data
    if (data?.error) {
        return data.error
    }
    if (data?.message) {
        return data.message
    }
    if (error instanceof Error && error.message) {
        return error.message
    }
    return fallback
}

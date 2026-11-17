/** Matches Go `pagination.PaginationRequest` validate tag `lte=100`. */
export function clampListLimit(limit?: number, fallback = 100): number {
    const n = limit ?? fallback
    return Math.min(100, Math.max(1, n))
}
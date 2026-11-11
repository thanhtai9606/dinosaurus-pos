export function getPaginationRange(currentPage: number, totalPages: number, delta = 2): (number | string)[] {
    if (totalPages <= 1) return totalPages === 1 ? [1] : []

    const range: number[] = []
    const rangeWithDots: (number | string)[] = []

    const start = Math.max(1, currentPage - delta)
    const end = Math.min(totalPages, currentPage + delta)

    for (let i = start; i <= end; i++) {
        range.push(i)
    }

    if (start > 2) {
        rangeWithDots.push(1, '...')
    } else if (start === 2) {
        rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (end < totalPages - 1) {
        rangeWithDots.push('...', totalPages)
    } else if (end === totalPages - 1) {
        rangeWithDots.push(totalPages)
    }

    return rangeWithDots
}

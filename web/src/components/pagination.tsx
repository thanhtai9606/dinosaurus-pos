import { useTranslation } from 'react-i18next'
import { ChevronFirst, ChevronLast, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { POSKasirInternalCommonPaginationPagination } from '@/lib/api/generated'
import { getPaginationRange } from '@/lib/pagination-range'
import { cn } from '@/lib/utils'

export interface ListPaginationProps {
    pagination: POSKasirInternalCommonPaginationPagination | undefined
    onPageChange: (page: number) => void
    onLimitChange?: (limit: number) => void
    pageSizeOptions?: number[]
    isFetching?: boolean
    className?: string
}

export function ListPagination({
    pagination,
    onPageChange,
    onLimitChange,
    pageSizeOptions = [10, 20, 50, 100],
    isFetching = false,
    className,
}: ListPaginationProps) {
    const { t } = useTranslation()

    if (!pagination) {
        return null
    }

    const currentPage = pagination.current_page || 1
    const totalPages = pagination.total_page || 1
    const perPage = pagination.per_page || pageSizeOptions[0]
    const total = pagination.total_data ?? 0

    const startItem = total === 0 ? 0 : Math.min((currentPage - 1) * perPage + 1, total)
    const endItem = Math.min(currentPage * perPage, total)
    const range = getPaginationRange(currentPage, totalPages)

    const showControls = totalPages > 1 || (onLimitChange && total > 0)

    if (!showControls && total === 0) {
        return null
    }

    return (
        <div
            className={cn(
                'flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between',
                className
            )}
        >
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {total > 0 && (
                    <p>
                        {t('pagination.showing_range', {
                            start: startItem,
                            end: endItem,
                            total,
                        })}
                    </p>
                )}
                {onLimitChange && total > 0 && (
                    <div className="flex items-center gap-2">
                        <span>{t('pagination.show')}</span>
                        <Select
                            value={String(perPage)}
                            onValueChange={(value) => onLimitChange(Number(value))}
                        >
                            <SelectTrigger className="h-8 w-[72px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {pageSizeOptions.map((size) => (
                                    <SelectItem key={size} value={String(size)}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span>{t('pagination.per_page')}</span>
                    </div>
                )}
                {isFetching && (
                    <span className="inline-flex items-center gap-1.5 text-xs">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {t('pagination.updating')}
                    </span>
                )}
            </div>

            {totalPages > 1 && (
                <Pagination className="mx-0 w-auto justify-end">
                    <PaginationContent>
                        <PaginationItem>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onPageChange(1)}
                                disabled={currentPage <= 1}
                                aria-label={t('pagination.first')}
                            >
                                <ChevronFirst className="h-4 w-4" />
                            </Button>
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationPrevious
                                text={t('pagination.previous')}
                                onClick={(e) => {
                                    e.preventDefault()
                                    onPageChange(currentPage - 1)
                                }}
                                className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                        </PaginationItem>
                        {range.map((pageNumber, index) => (
                            <PaginationItem key={`${pageNumber}-${index}`}>
                                {pageNumber === '...' ? (
                                    <PaginationEllipsis />
                                ) : (
                                    <PaginationLink
                                        onClick={(e) => {
                                            e.preventDefault()
                                            onPageChange(Number(pageNumber))
                                        }}
                                        isActive={pageNumber === currentPage}
                                        className="cursor-pointer"
                                    >
                                        {pageNumber}
                                    </PaginationLink>
                                )}
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationNext
                                text={t('pagination.next')}
                                onClick={(e) => {
                                    e.preventDefault()
                                    onPageChange(currentPage + 1)
                                }}
                                className={
                                    currentPage >= totalPages
                                        ? 'pointer-events-none opacity-50'
                                        : 'cursor-pointer'
                                }
                            />
                        </PaginationItem>
                        <PaginationItem>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onPageChange(totalPages)}
                                disabled={currentPage >= totalPages}
                                aria-label={t('pagination.last')}
                            >
                                <ChevronLast className="h-4 w-4" />
                            </Button>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    )
}

/** @deprecated Prefer ListPagination with onPageChange */
interface NewPaginationProps {
    pagination: POSKasirInternalCommonPaginationPagination | undefined
    onClickPrev: () => void
    onClickNext: () => void
}

export function NewPagination({ pagination, onClickPrev, onClickNext }: NewPaginationProps) {
    const current = pagination?.current_page || 1
    return (
        <ListPagination
            pagination={pagination}
            onPageChange={(page) => {
                if (page < current) onClickPrev()
                else if (page > current) onClickNext()
            }}
        />
    )
}

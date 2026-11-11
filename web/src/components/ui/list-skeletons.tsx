import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function DataTableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
    return (
        <div className="rounded-md border bg-card overflow-hidden" aria-busy aria-label="Loading">
            <Table>
                <TableHeader>
                    <TableRow>
                        {Array.from({ length: columns }).map((_, i) => (
                            <TableHead key={i}>
                                <Skeleton className="h-4 w-20" />
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: rows }).map((_, row) => (
                        <TableRow key={row}>
                            {Array.from({ length: columns }).map((_, col) => (
                                <TableCell key={col}>
                                    <Skeleton className="h-4 w-full max-w-[120px]" />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export function UserCardSkeleton() {
    return (
        <Card>
            <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-36" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                </div>
            </CardContent>
        </Card>
    )
}

export function UserGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: count }).map((_, i) => (
                <UserCardSkeleton key={i} />
            ))}
        </div>
    )
}

export function CustomerCardSkeleton() {
    return (
        <Card>
            <CardContent className="space-y-2 p-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-24" />
            </CardContent>
        </Card>
    )
}

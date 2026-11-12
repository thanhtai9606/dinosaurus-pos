import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { useTranslation } from 'react-i18next'
import {
    suppliersListQueryOptions,
    SuppliersListParams,
    useCreateSupplierMutation,
    useDeleteSupplierMutation,
    Supplier,
} from '@/lib/api/query/suppliers'
import { SupplierFormDialog } from '@/components/suppliers/SupplierFormDialog'
import { ListPagination } from '@/components/pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const searchSchema = z.object({
    page: z.number().catch(1),
    limit: z.number().catch(10),
    search: z.string().optional(),
})

export const Route = createFileRoute('/$locale/_dashboard/suppliers')({
    validateSearch: (search) => searchSchema.parse(search),
    loaderDeps: ({ search }) => search,
    loader: ({ context: { queryClient }, deps }) =>
        queryClient.ensureQueryData(suppliersListQueryOptions(deps as SuppliersListParams)),
    component: SuppliersPage,
})

function SuppliersPage() {
    const { t } = useTranslation()
    const navigate = useNavigate({ from: Route.fullPath })
    const searchParams = Route.useSearch() as SuppliersListParams
    const { data } = useSuspenseQuery(suppliersListQueryOptions(searchParams))
    const { isAllowed: canCreate } = useCreateSupplierMutation()
    const deleteMutation = useDeleteSupplierMutation()

    const [dialogOpen, setDialogOpen] = useState(false)
    const [selected, setSelected] = useState<Supplier | null>(null)
    const [searchTerm, setSearchTerm] = useState(searchParams.search || '')
    const debouncedSearch = useDebounce(searchTerm, 400)

    useEffect(() => {
        if (debouncedSearch !== (searchParams.search || '')) {
            navigate({ search: (prev) => ({ ...prev, search: debouncedSearch || undefined, page: 1 }), replace: true })
        }
    }, [debouncedSearch, navigate, searchParams.search])

    return (
        <div className="space-y-4 p-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t('suppliers.title')}</CardTitle>
                    {canCreate && (
                        <Button
                            onClick={() => {
                                setSelected(null)
                                setDialogOpen(true)
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            {t('suppliers.actions.add')}
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input
                        placeholder={t('suppliers.search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('suppliers.fields.code')}</TableHead>
                                <TableHead>{t('suppliers.fields.name')}</TableHead>
                                <TableHead>{t('suppliers.fields.phone')}</TableHead>
                                <TableHead className="text-right">{t('common.actions', 'Actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(data.suppliers || []).map((s) => (
                                <TableRow key={s.id}>
                                    <TableCell>{s.code || '—'}</TableCell>
                                    <TableCell className="font-medium">{s.name}</TableCell>
                                    <TableCell>{s.phone || '—'}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setSelected(s)
                                                setDialogOpen(true)
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        {deleteMutation.isAllowed && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => s.id && deleteMutation.mutate(s.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <ListPagination
                        pagination={data.pagination}
                        onPageChange={(page) => navigate({ search: (prev) => ({ ...prev, page }) })}
                        onLimitChange={(limit) => navigate({ search: (prev) => ({ ...prev, limit, page: 1 }) })}
                    />
                </CardContent>
            </Card>
            <SupplierFormDialog open={dialogOpen} onOpenChange={setDialogOpen} supplierToEdit={selected} />
        </div>
    )
}

import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useMemo } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { useServerListState } from '@/hooks/use-server-list-state'
import { LIST_SCOPES } from '@/stores/list-scopes'
import { useTranslation } from 'react-i18next'
import {
    suppliersListQueryOptions,
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

export const Route = createFileRoute('/_dashboard/suppliers')({
    component: SuppliersPage,
})

function SuppliersPage() {
    const { t } = useTranslation()
    const { page, limit, onPageChange, onLimitChange, resetPage } = useServerListState({ scope: LIST_SCOPES.suppliers })
    const [searchTerm, setSearchTerm] = useState('')
    const debouncedSearch = useDebounce(searchTerm, 400)

    useEffect(() => {
        resetPage()
    }, [debouncedSearch, resetPage])

    const listParams = useMemo(
        () => ({
            page,
            limit,
            search: debouncedSearch || undefined,
        }),
        [page, limit, debouncedSearch],
    )

    const { data, isFetching } = useQuery(suppliersListQueryOptions(listParams))
    const { isAllowed: canCreate } = useCreateSupplierMutation()
    const deleteMutation = useDeleteSupplierMutation()

    const [dialogOpen, setDialogOpen] = useState(false)
    const [selected, setSelected] = useState<Supplier | null>(null)

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
                            {(data?.suppliers || []).map((s) => (
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
                    {data?.pagination && (
                        <ListPagination
                            pagination={data.pagination}
                            onPageChange={onPageChange}
                            onLimitChange={onLimitChange}
                            isFetching={isFetching}
                        />
                    )}
                </CardContent>
            </Card>
            <SupplierFormDialog open={dialogOpen} onOpenChange={setDialogOpen} supplierToEdit={selected} />
        </div>
    )
}

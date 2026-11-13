import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useMemo } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { useServerListState } from '@/hooks/use-server-list-state'
import { LIST_SCOPES } from '@/stores/list-scopes'
import { useTranslation } from 'react-i18next'
import {
    customerGroupsListQueryOptions,
    useCreateCustomerGroupMutation,
    useDeleteCustomerGroupMutation,
    CustomerGroup,
} from '@/lib/api/query/customerGroups'
import { CustomerGroupFormDialog } from '@/components/customergroups/CustomerGroupFormDialog'
import { ListPagination } from '@/components/pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export const Route = createFileRoute('/_dashboard/customer-groups')({
    component: CustomerGroupsPage,
})

function CustomerGroupsPage() {
    const { t } = useTranslation()
    const { page, limit, onPageChange, onLimitChange, resetPage } = useServerListState({
        scope: LIST_SCOPES.customerGroups,
    })
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

    const { data, isFetching } = useQuery(customerGroupsListQueryOptions(listParams))
    const { isAllowed: canCreate } = useCreateCustomerGroupMutation()
    const { mutate: deleteGroup, isAllowed: canDelete } = useDeleteCustomerGroupMutation()

    const [dialogOpen, setDialogOpen] = useState(false)
    const [selected, setSelected] = useState<CustomerGroup | null>(null)
    const pagination = data?.pagination
    const groups = data?.groups || []

    return (
        <div className="space-y-4 p-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t('customerGroups.title')}</CardTitle>
                    {canCreate && (
                        <Button
                            onClick={() => {
                                setSelected(null)
                                setDialogOpen(true)
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            {t('customerGroups.actions.add')}
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input
                        placeholder={t('customerGroups.search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('customerGroups.fields.code')}</TableHead>
                                <TableHead>{t('customerGroups.fields.name')}</TableHead>
                                <TableHead>{t('customerGroups.fields.description')}</TableHead>
                                <TableHead className="text-right">{t('common.actions', 'Actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {groups.map((g) => (
                                <TableRow key={g.id}>
                                    <TableCell className="font-mono text-xs">{g.code}</TableCell>
                                    <TableCell className="font-medium">{g.name}</TableCell>
                                    <TableCell className="max-w-md truncate text-muted-foreground">
                                        {g.description || '—'}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setSelected(g)
                                                setDialogOpen(true)
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        {canDelete && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => deleteGroup(g.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {pagination && (
                        <ListPagination
                            pagination={pagination}
                            onPageChange={onPageChange}
                            onLimitChange={onLimitChange}
                            isFetching={isFetching}
                        />
                    )}
                </CardContent>
            </Card>
            <CustomerGroupFormDialog open={dialogOpen} onOpenChange={setDialogOpen} groupToEdit={selected} />
        </div>
    )
}

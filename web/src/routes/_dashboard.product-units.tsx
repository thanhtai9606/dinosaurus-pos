import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { useResetPageOnChange } from '@/hooks/use-reset-page-on-change'
import { useServerListState } from '@/hooks/use-server-list-state'
import { LIST_SCOPES } from '@/stores/list-scopes'
import { useTranslation } from 'react-i18next'
import { Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ListFilterField, ListSearchToolbar } from '@/components/data-table/ListSearchToolbar'
import {
    measurementUnitsListQueryOptions,
    useCreateMeasurementUnitMutation,
    useUpdateMeasurementUnitMutation,
    useDeleteMeasurementUnitMutation,
    type MeasurementUnit,
} from '@/lib/api/query/measurementUnits'
import { MeasurementUnitsHeader } from '@/components/measurementunits/MeasurementUnitsHeader'
import { MeasurementUnitsTable } from '@/components/measurementunits/MeasurementUnitsTable'
import { MeasurementUnitFormDialog } from '@/components/measurementunits/MeasurementUnitFormDialog'

export const Route = createFileRoute('/_dashboard/product-units')({
    component: ProductUnitsPage,
})

function ProductUnitsPage() {
    const { t } = useTranslation()
    const { page, limit, onPageChange, onLimitChange, resetPage } = useServerListState({
        scope: LIST_SCOPES.productUnits,
    })
    const [searchTerm, setSearchTerm] = useState('')
    const debouncedSearch = useDebounce(searchTerm, 400)
    const isSearchPending = searchTerm !== debouncedSearch

    useResetPageOnChange(resetPage, [debouncedSearch])

    const listParams = useMemo(
        () => ({
            page,
            limit,
            search: debouncedSearch || undefined,
        }),
        [page, limit, debouncedSearch],
    )

    const unitsQuery = useQuery(measurementUnitsListQueryOptions(listParams))
    const units = unitsQuery.data?.units ?? []
    const pagination = unitsQuery.data?.pagination

    const { isAllowed: canCreate } = useCreateMeasurementUnitMutation()
    const { isAllowed: canEdit } = useUpdateMeasurementUnitMutation()
    const { isAllowed: canDelete } = useDeleteMeasurementUnitMutation()

    const [dialogOpen, setDialogOpen] = useState(false)
    const [selected, setSelected] = useState<MeasurementUnit | null>(null)

    const openDialog = (unit: MeasurementUnit | null) => {
        setSelected(unit)
        setDialogOpen(true)
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            <MeasurementUnitsHeader t={t} canCreate={canCreate} onCreate={() => openDialog(null)} />

            <ListSearchToolbar>
                <ListFilterField label={t('measurementUnits.filters.search_label')} className="min-w-[min(100%,20rem)] flex-[2]">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            className="h-9 pl-8 pr-8"
                            placeholder={t('measurementUnits.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {(isSearchPending || unitsQuery.isFetching) && (
                            <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                    </div>
                </ListFilterField>
            </ListSearchToolbar>

            <MeasurementUnitsTable
                units={units}
                t={t}
                onRowClick={canEdit ? (u) => openDialog(u) : undefined}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={(u) => openDialog(u)}
                server={
                    pagination
                        ? {
                              pagination,
                              onPageChange,
                              onLimitChange,
                              isFetching: unitsQuery.isFetching || isSearchPending,
                          }
                        : undefined
                }
            />

            <MeasurementUnitFormDialog open={dialogOpen} onOpenChange={setDialogOpen} unitToEdit={selected} />
        </div>
    )
}

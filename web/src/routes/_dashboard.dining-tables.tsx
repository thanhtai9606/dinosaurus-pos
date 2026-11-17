import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
    useCreateDiningAreaMutation,
    useCreateDiningTableMutation,
    useDeleteDiningAreaMutation,
    useDiningAreasQuery,
    useDiningTablesQuery,
    useUpdateDiningAreaMutation,
    useUpdateDiningTableStatusMutation,
    type DiningArea,
    type DiningTable,
} from '@/lib/api/query/dining'

export const Route = createFileRoute('/_dashboard/dining-tables')({
    component: DiningTablesPage,
})

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    available: 'default',
    occupied: 'destructive',
    reserved: 'secondary',
    dirty: 'outline',
}

const TABLE_STATUSES: DiningTable['status'][] = ['available', 'occupied', 'reserved', 'dirty']

function DiningTablesPage() {
    const { t } = useTranslation()
    const { data: areas, isLoading: areasLoading, isError: areasError } = useDiningAreasQuery()
    const { data: tables, isLoading: tablesLoading, isError: tablesError } = useDiningTablesQuery()
    const createArea = useCreateDiningAreaMutation()
    const updateArea = useUpdateDiningAreaMutation()
    const deleteArea = useDeleteDiningAreaMutation()
    const createTable = useCreateDiningTableMutation()
    const updateStatus = useUpdateDiningTableStatusMutation()

    const [areaFilter, setAreaFilter] = useState<string>('all')
    const [areaDialog, setAreaDialog] = useState(false)
    const [tableDialog, setTableDialog] = useState(false)
    const [editingArea, setEditingArea] = useState<DiningArea | null>(null)
    const [deleteAreaTarget, setDeleteAreaTarget] = useState<DiningArea | null>(null)
    const [newAreaName, setNewAreaName] = useState('')
    const [newAreaSortOrder, setNewAreaSortOrder] = useState(0)
    const [newTableAreaId, setNewTableAreaId] = useState('')
    const [newTableName, setNewTableName] = useState('')
    const [newTableCapacity, setNewTableCapacity] = useState(4)

    const tableCountByArea = useMemo(() => {
        const map = new Map<string, number>()
        for (const tbl of tables ?? []) {
            map.set(tbl.area_id, (map.get(tbl.area_id) ?? 0) + 1)
        }
        return map
    }, [tables])

    const filtered = useMemo(() => {
        const list = tables ?? []
        if (areaFilter === 'all') return list
        return list.filter((tbl) => tbl.area_id === areaFilter)
    }, [tables, areaFilter])

    const isLoading = areasLoading || tablesLoading
    const isError = areasError || tablesError
    const canManageAreas = createArea.isAllowed || updateArea.isAllowed || deleteArea.isAllowed

    const openCreateArea = () => {
        setEditingArea(null)
        setNewAreaName('')
        setNewAreaSortOrder((areas?.length ?? 0) * 10)
        setAreaDialog(true)
    }

    const openEditArea = (area: DiningArea) => {
        setEditingArea(area)
        setNewAreaName(area.name)
        setNewAreaSortOrder(area.sort_order)
        setAreaDialog(true)
    }

    const openTableDialog = () => {
        const first = areas?.[0]?.id ?? ''
        setNewTableAreaId(areaFilter !== 'all' ? areaFilter : first)
        setNewTableName('')
        setNewTableCapacity(4)
        setTableDialog(true)
    }

    const saveArea = () => {
        const name = newAreaName.trim()
        if (!name) return
        const sort_order = newAreaSortOrder
        if (editingArea) {
            updateArea.mutate(
                { id: editingArea.id, name, sort_order },
                {
                    onSuccess: () => {
                        setAreaDialog(false)
                        setEditingArea(null)
                    },
                },
            )
        } else {
            createArea.mutate(
                { name, sort_order },
                {
                    onSuccess: () => {
                        setAreaDialog(false)
                        setNewAreaName('')
                    },
                },
            )
        }
    }

    return (
        <div className="space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h1 className="text-xl font-semibold">{t('dining.title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('dining.subtitle')}</p>
                </div>
                {canManageAreas && (
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={openCreateArea} disabled={!createArea.isAllowed}>
                            <Plus className="h-4 w-4 mr-1" />
                            {t('dining.actions.add_area')}
                        </Button>
                        <Button size="sm" onClick={openTableDialog} disabled={!createTable.isAllowed || !(areas?.length)}>
                            <Plus className="h-4 w-4 mr-1" />
                            {t('dining.actions.add_table')}
                        </Button>
                    </div>
                )}
            </div>

            {isError && (
                <Alert variant="destructive">
                    <AlertDescription>{t('dining.errors.load_failed')}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t('dining.areas_section')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {(areas ?? []).length === 0 && !areasLoading && (
                        <p className="text-sm text-muted-foreground">{t('dining.empty_hint')}</p>
                    )}
                    <ul className="divide-y rounded-md border">
                        {(areas ?? []).map((area) => (
                            <li key={area.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                                <div>
                                    <p className="font-medium">{area.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {t('dining.table_count', { count: tableCountByArea.get(area.id) ?? 0 })}
                                        {' · '}
                                        {t('dining.fields.sort_order')}: {area.sort_order}
                                    </p>
                                </div>
                                {canManageAreas && (
                                    <div className="flex gap-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            disabled={!updateArea.isAllowed}
                                            onClick={() => openEditArea(area)}
                                            title={t('dining.actions.edit_area')}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive"
                                            disabled={!deleteArea.isAllowed}
                                            onClick={() => setDeleteAreaTarget(area)}
                                            title={t('dining.actions.delete_area')}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-base">{t('dining.filter_area')}</CardTitle>
                    <Select value={areaFilter} onValueChange={setAreaFilter}>
                        <SelectTrigger className="w-[min(100%,220px)]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('dining.all_areas')}</SelectItem>
                            {(areas ?? []).map((a) => (
                                <SelectItem key={a.id} value={a.id}>
                                    {a.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {isLoading && <p className="text-muted-foreground col-span-full">{t('common.loading')}</p>}
                    {!isLoading && !isError && filtered.length === 0 && (
                        <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                            <p className="font-medium">{t('dining.empty_title')}</p>
                            <p className="text-sm mt-1">{t('dining.empty_hint')}</p>
                        </div>
                    )}
                    {filtered.map((table) => (
                        <Card key={table.id} className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center justify-between gap-2">
                                    <span>{table.name}</span>
                                    <Badge variant={statusVariant[table.status] ?? 'secondary'} className="shrink-0">
                                        {t(`dining.status.${table.status}`)}
                                    </Badge>
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">{table.area_name}</p>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <p className="text-sm text-muted-foreground">{t('dining.seats', { count: table.capacity })}</p>
                                {updateStatus.isAllowed && (
                                    <Select
                                        value={table.status}
                                        onValueChange={(v) =>
                                            updateStatus.mutate({ id: table.id, status: v as DiningTable['status'] })
                                        }
                                    >
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TABLE_STATUSES.map((s) => (
                                                <SelectItem key={s} value={s}>
                                                    {t(`dining.status.${s}`)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>

            <Dialog open={areaDialog} onOpenChange={setAreaDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingArea ? t('dining.dialog.edit_area') : t('dining.dialog.new_area')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label htmlFor="area-name">{t('dining.fields.area_name')}</Label>
                            <Input
                                id="area-name"
                                value={newAreaName}
                                onChange={(e) => setNewAreaName(e.target.value)}
                                placeholder={t('dining.placeholders.area_name')}
                            />
                        </div>
                        <div>
                            <Label htmlFor="area-sort">{t('dining.fields.sort_order')}</Label>
                            <Input
                                id="area-sort"
                                type="number"
                                min={0}
                                value={newAreaSortOrder}
                                onChange={(e) => setNewAreaSortOrder(Number(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            disabled={
                                !newAreaName.trim() ||
                                (editingArea ? updateArea.isPending : createArea.isPending)
                            }
                            onClick={saveArea}
                        >
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteAreaTarget} onOpenChange={(o) => !o && setDeleteAreaTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('dining.delete_area.title')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('dining.delete_area.description')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteArea.isPending}
                            onClick={() => {
                                if (!deleteAreaTarget) return
                                deleteArea.mutate(deleteAreaTarget.id, {
                                    onSuccess: () => {
                                        setDeleteAreaTarget(null)
                                        if (areaFilter === deleteAreaTarget.id) setAreaFilter('all')
                                    },
                                })
                            }}
                        >
                            {t('dining.actions.delete_area')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={tableDialog} onOpenChange={setTableDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('dining.dialog.new_table')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label>{t('dining.fields.area')}</Label>
                            <Select value={newTableAreaId} onValueChange={setNewTableAreaId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('dining.placeholders.select_area')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {(areas ?? []).map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                            {a.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="table-name">{t('dining.fields.table_name')}</Label>
                            <Input
                                id="table-name"
                                value={newTableName}
                                onChange={(e) => setNewTableName(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="table-cap">{t('dining.fields.capacity')}</Label>
                            <Input
                                id="table-cap"
                                type="number"
                                min={1}
                                max={99}
                                value={newTableCapacity}
                                onChange={(e) => setNewTableCapacity(Number(e.target.value) || 1)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            disabled={!newTableAreaId || !newTableName.trim() || createTable.isPending}
                            onClick={() =>
                                createTable.mutate(
                                    {
                                        area_id: newTableAreaId,
                                        name: newTableName.trim(),
                                        capacity: newTableCapacity,
                                    },
                                    {
                                        onSuccess: () => {
                                            setTableDialog(false)
                                            setNewTableName('')
                                        },
                                    },
                                )
                            }
                        >
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
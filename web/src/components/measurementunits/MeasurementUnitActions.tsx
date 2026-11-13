import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { MeasurementUnit } from '@/lib/api/query/measurementUnits'
import { useDeleteMeasurementUnitMutation } from '@/lib/api/query/measurementUnits'
import { useTranslation } from 'react-i18next'

type Props = {
    unit: MeasurementUnit
    onEdit: () => void
    canEdit: boolean
    canDelete: boolean
}

export function MeasurementUnitActions({ unit, onEdit, canEdit, canDelete }: Props) {
    const { t } = useTranslation()
    const deleteMutation = useDeleteMeasurementUnitMutation()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {canEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t('common.edit')}
                    </DropdownMenuItem>
                )}
                {canDelete && (
                    <DropdownMenuItem
                        className="text-destructive"
                        disabled={deleteMutation.isPending}
                        onClick={() => void deleteMutation.mutateAsync(unit.id)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('common.delete')}
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

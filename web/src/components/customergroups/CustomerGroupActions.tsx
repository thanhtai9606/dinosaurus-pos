import { useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { CustomerGroup } from '@/lib/api/query/customerGroups'
import { useDeleteCustomerGroupMutation } from '@/lib/api/query/customerGroups'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
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

export function CustomerGroupActions({
    group,
    onEdit,
    canEdit = true,
    canDelete = true,
}: {
    group: CustomerGroup
    onEdit: () => void
    canEdit?: boolean
    canDelete?: boolean
}) {
    const { t } = useTranslation()
    const deleteMutation = useDeleteCustomerGroupMutation()
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    const handleDelete = async (e: MouseEvent) => {
        e.preventDefault()
        await deleteMutation.mutateAsync(group.id)
        setShowDeleteDialog(false)
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                        <span className="sr-only">{t('customerGroups.actions.open_menu')}</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuLabel>{t('customerGroups.table.actions')}</DropdownMenuLabel>
                    {canEdit && (
                        <DropdownMenuItem onClick={onEdit}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t('customerGroups.actions.edit')}
                        </DropdownMenuItem>
                    )}
                    {canEdit && canDelete && <DropdownMenuSeparator />}
                    {canDelete && (
                        <DropdownMenuItem
                            onSelect={(e) => {
                                e.preventDefault()
                                setShowDeleteDialog(true)
                            }}
                            className="cursor-pointer text-destructive focus:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('customerGroups.actions.delete')}
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('customerGroups.actions.delete_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('customerGroups.actions.delete_desc')}
                            <span className="font-bold text-foreground"> &quot;{group.name}&quot;</span>?
                            {t('customerGroups.actions.delete_desc_2')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>
                            {t('common.cancel', 'Cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            className="bg-destructive hover:bg-destructive/90 focus:ring-destructive"
                        >
                            {deleteMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('customerGroups.actions.deleting')}
                                </>
                            ) : (
                                t('customerGroups.actions.delete_confirm')
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

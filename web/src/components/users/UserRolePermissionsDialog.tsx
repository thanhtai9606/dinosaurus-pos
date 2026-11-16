import { useTranslation } from 'react-i18next'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog.tsx'
import { RoleMenuAccessCard } from '@/components/settings/RoleMenuAccessCard'
import { Shield } from 'lucide-react'

export function UserRolePermissionsDialog({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const { t } = useTranslation()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="xl" dismissible className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        {t('settings.permissions.menu_title')}
                    </DialogTitle>
                    <DialogDescription>{t('settings.permissions.menu_description')}</DialogDescription>
                </DialogHeader>
                <RoleMenuAccessCard showApiPreview />
            </DialogContent>
        </Dialog>
    )
}
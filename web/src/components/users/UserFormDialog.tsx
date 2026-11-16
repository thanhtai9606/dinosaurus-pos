// --- FORM DIALOG (CREATE / EDIT) ---
import {
    InternalUserCreateUserRequest,
    InternalUserProfileResponse,
    InternalUserUpdateUserRequest,
    UsersGetRoleEnum
} from "@/lib/api/generated";
import { useTranslation } from "react-i18next";
import { useCreateUserMutation, useUpdateUserMutation } from "@/lib/api/query/user.ts";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useForm } from '@tanstack/react-form';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Loader2, Shield, User } from "lucide-react";
import { RoleMenuAccessCard, isTenantRole } from '@/components/settings/RoleMenuAccessCard'
import { useRBAC } from '@/lib/auth/rbac'
import type { DialogSize } from '@/components/ui/dialog'

export function UserFormDialog({ open, onOpenChange, userToEdit }: {
    open: boolean,
    onOpenChange: (open: boolean) => void,
    userToEdit: InternalUserProfileResponse | null
}) {
    const { t } = useTranslation()
    const createMutation = useCreateUserMutation()
    const updateMutation = useUpdateUserMutation()
    const { canAccessApi } = useRBAC()
    const canManageMenuAccess = canAccessApi('GET', '/settings/menu-access')
    const [dialogTab, setDialogTab] = useState<'profile' | 'permissions'>('profile')

    const form = useForm({
        defaultValues: {
            username: '',
            email: '',
            password: '',
            role: UsersGetRoleEnum.Cashier as UsersGetRoleEnum
        },
        validators: {
            onChange: z.object({
                username: z.string().min(1),
                email: z.string().email(),
                password: userToEdit ? z.string() : z.string().min(6),
                role: z.nativeEnum(UsersGetRoleEnum)
            })
        },
        onSubmit: async ({ value }) => {
            try {
                if (userToEdit) {
                    const payload: InternalUserUpdateUserRequest = {
                        username: value.username,
                        email: value.email,
                        role: value.role,
                    }

                    await updateMutation.mutateAsync({ id: userToEdit.id!, body: payload })
                    toast.success(t('users.form.success_update'))
                } else {
                    const payload: InternalUserCreateUserRequest = {
                        username: value.username,
                        email: value.email,
                        password: value.password,
                        role: value.role,
                        is_active: true
                    }
                    await createMutation.mutateAsync(payload)
                    toast.success(t('users.form.success_create'))
                }
                onOpenChange(false)
                form.reset()
            } catch (error) {
                console.error(error)
                toast.error(t('users.form.error_save'))
            }
        }
    })

    useEffect(() => {
        if (open) {
            setDialogTab('profile')
            if (userToEdit) {
                form.setFieldValue('username', userToEdit.username || '')
                form.setFieldValue('email', userToEdit.email || '')
                form.setFieldValue('password', '')
                form.setFieldValue('role', (userToEdit.role as UsersGetRoleEnum) || UsersGetRoleEnum.Cashier)
            } else {
                form.reset()
            }
        }
    }, [open, userToEdit])

    const showPermissionsTab = !!userToEdit && canManageMenuAccess
    const dialogSize: DialogSize = showPermissionsTab ? 'xl' : 'md'

    const profileForm = (
        <form onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}>
                    <div className="grid gap-4 py-4">
                        {/* Username */}
                        <form.Field
                            name="username"
                            children={(field) => (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor={field.name} className="text-right">{t('users.form.username')}</Label>
                                    <div className="col-span-3 flex flex-col gap-1">
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={e => field.handleChange(e.target.value)}
                                        />
                                        {field.state.meta.errors.length > 0 && (
                                            <em role="alert" className="text-sm font-medium text-destructive">
                                                {field.state.meta.errors.map(err => typeof err === 'object' ? ((err as any).message ?? JSON.stringify(err)) : String(err)).join(', ')}
                                            </em>
                                        )}
                                    </div>
                                </div>
                            )}
                        />
                        {/* Email */}
                        <form.Field
                            name="email"
                            children={(field) => (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor={field.name} className="text-right">{t('users.form.email')}</Label>
                                    <div className="col-span-3 flex flex-col gap-1">
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            type="email"
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={e => field.handleChange(e.target.value)}
                                        />
                                        {field.state.meta.errors.length > 0 && (
                                            <em role="alert" className="text-sm font-medium text-destructive">
                                                {field.state.meta.errors.map(err => typeof err === 'object' ? ((err as any).message ?? JSON.stringify(err)) : String(err)).join(', ')}
                                            </em>
                                        )}
                                    </div>
                                </div>
                            )}
                        />
                        {/* Role */}
                        <form.Field
                            name="role"
                            children={(field) => (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor={field.name} className="text-right">{t('users.form.role')}</Label>
                                    <div className="col-span-3 flex flex-col gap-1">
                                        <Select
                                            value={field.state.value}
                                            onValueChange={(val: UsersGetRoleEnum) => field.handleChange(val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('users.form.select_role')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={UsersGetRoleEnum.Admin}>{t('users.roles.admin')}</SelectItem>
                                                <SelectItem value={UsersGetRoleEnum.Manager}>{t('users.roles.manager')}</SelectItem>
                                                <SelectItem value={UsersGetRoleEnum.Cashier}>{t('users.roles.cashier')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {field.state.meta.errors.length > 0 && (
                                            <em role="alert" className="text-sm font-medium text-destructive">
                                                {field.state.meta.errors.map(err => typeof err === 'object' ? ((err as any).message ?? JSON.stringify(err)) : String(err)).join(', ')}
                                            </em>
                                        )}
                                    </div>
                                </div>
                            )}
                        />

                        {/* Password */}
                        {!userToEdit && (
                            <form.Field
                                name="password"
                                children={(field) => (
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor={field.name} className="text-right">{t('users.form.password')}</Label>
                                        <div className="col-span-3 flex flex-col gap-1">
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                type="password"
                                                placeholder={t('users.form.password_placeholder')}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={e => field.handleChange(e.target.value)}
                                            />
                                            {field.state.meta.errors.length > 0 && (
                                                <em role="alert" className="text-sm font-medium text-destructive">
                                                    {field.state.meta.errors.map(err => typeof err === 'object' ? ((err as any).message ?? JSON.stringify(err)) : String(err)).join(', ')}
                                                </em>
                                            )}
                                        </div>
                                    </div>
                                )}
                            />
                        )}
                    </div>
                    <DialogFooter>
                        <form.Subscribe
                            selector={(state) => [state.canSubmit, state.isSubmitting]}
                            children={([canSubmit, isSubmitting]) => (
                                <Button type="submit" disabled={!canSubmit || isSubmitting || createMutation.isPending || updateMutation.isPending}>
                                    {(isSubmitting || createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {userToEdit ? t('users.form.save_changes') : t('users.form.create_user')}
                                </Button>
                            )}
                        />
                    </DialogFooter>
                </form>
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size={dialogSize} dismissible className={showPermissionsTab ? 'max-h-[90vh] overflow-y-auto' : undefined}>
                <DialogHeader>
                    <DialogTitle>{userToEdit ? t('users.form.title_edit') : t('users.form.title_create')}</DialogTitle>
                    <DialogDescription>
                        {userToEdit ? t('users.form.desc_edit') : t('users.form.desc_create')}
                    </DialogDescription>
                </DialogHeader>
                {showPermissionsTab ? (
                    <Tabs value={dialogTab} onValueChange={(v) => setDialogTab(v as 'profile' | 'permissions')}>
                        <TabsList className="mb-2">
                            <TabsTrigger value="profile" className="gap-2">
                                <User className="h-4 w-4" />
                                {t('users.tabs.profile')}
                            </TabsTrigger>
                            <TabsTrigger value="permissions" className="gap-2">
                                <Shield className="h-4 w-4" />
                                {t('users.tabs.permissions')}
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="profile">{profileForm}</TabsContent>
                        <TabsContent value="permissions" className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                <form.Subscribe
                                    selector={(state) => state.values.role}
                                    children={(role) =>
                                        isTenantRole(role)
                                            ? t('users.permissions.role_hint', { role: t(`users.roles.${role}`) })
                                            : t('users.permissions.role_hint_generic')
                                    }
                                />
                            </p>
                            <form.Subscribe
                                selector={(state) => state.values.role}
                                children={(role) => (
                                    <RoleMenuAccessCard
                                        embedded
                                        showApiPreview={false}
                                        highlightRole={isTenantRole(role) ? role : null}
                                    />
                                )}
                            />
                        </TabsContent>
                    </Tabs>
                ) : (
                    profileForm
                )}
            </DialogContent>
        </Dialog>
    )
}
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { useMenuAccessQuery, useUpdateMenuAccessMutation } from '@/lib/api/query/menuAccess'
import type { TenantRole } from '@/lib/auth/menuCatalog'
import { RBAC_RULES } from '@/lib/auth/rbacRules'
import { Loader2, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { useRBAC } from '@/lib/auth/rbac'

const ROLES: TenantRole[] = ['admin', 'manager', 'cashier']

const API_PREVIEW_KEYS = [
    'GET /orders',
    'POST /orders',
    'GET /products',
    'POST /products',
    'GET /supplier-debts',
    'GET /supplier-debts/export',
    'GET /customer-debts',
    'GET /reports/sales-summary',
    'GET /users',
    'POST /users',
    'GET /settings/menu-access',
    'PUT /settings/menu-access',
] as const

export function RoleMenuAccessCard() {
    const { t } = useTranslation()
    const { data, isLoading } = useMenuAccessQuery()
    const updateMutation = useUpdateMenuAccessMutation()
    const { canAccessApi } = useRBAC()
    const canEdit = canAccessApi('PUT', '/settings/menu-access')

    const [draft, setDraft] = useState<Record<string, TenantRole[]> | null>(null)

    const workingItems = useMemo(() => {
        if (!data) return {}
        if (draft) return draft
        return buildWorkingItems(data.defaults, data.items)
    }, [data, draft])

    const toggle = (key: string, role: TenantRole, checked: boolean) => {
        if (!data) return
        const item = data.catalog.find((c) => c.key === key)
        if (item?.admin_lock && role === 'admin' && !checked) {
            toast.error(t('settings.permissions.admin_lock'))
            return
        }
        setDraft((prev) => {
            const base = prev ?? buildWorkingItems(data.defaults, data.items)
            const current = new Set(base[key] ?? [])
            if (checked) current.add(role)
            else current.delete(role)
            return { ...base, [key]: ROLES.filter((r) => current.has(r)) }
        })
    }

    const handleSave = async () => {
        if (!data || !draft) return
        try {
            const diff: Record<string, TenantRole[]> = {}
            for (const entry of data.catalog) {
                const def = data.defaults[entry.key] ?? entry.default_roles
                const next = workingItems[entry.key] ?? []
                if (!sameRoles(def, next)) {
                    diff[entry.key] = next
                }
            }
            await updateMutation.mutateAsync(diff)
            setDraft(null)
            toast.success(t('settings.permissions.saved'))
        } catch {
            toast.error(t('settings.permissions.save_failed'))
        }
    }

    if (isLoading || !data) {
        return (
            <Card>
                <CardContent className="flex items-center gap-2 py-8 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('common.loading')}
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        {t('settings.permissions.menu_title')}
                    </CardTitle>
                    <CardDescription>{t('settings.permissions.menu_description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('settings.permissions.menu_column')}</TableHead>
                                    <TableHead className="w-24 text-center">{t('users.roles.admin')}</TableHead>
                                    <TableHead className="w-24 text-center">{t('users.roles.manager')}</TableHead>
                                    <TableHead className="w-24 text-center">{t('users.roles.cashier')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.catalog.map((row) => {
                                    const roles = workingItems[row.key] ?? []
                                    return (
                                        <TableRow key={row.key}>
                                            <TableCell>
                                                <MenuPermissionLabel t={t} labelKey={row.label_key} sectionKey={row.section_key} />
                                            </TableCell>
                                            {ROLES.map((role) => (
                                                <TableCell key={role} className="text-center">
                                                    <Checkbox
                                                        checked={roles.includes(role)}
                                                        disabled={!canEdit || (row.admin_lock && role === 'admin')}
                                                        onCheckedChange={(v) => toggle(row.key, role, v === true)}
                                                        aria-label={`${row.key}-${role}`}
                                                    />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                    {canEdit && (
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                disabled={!draft || updateMutation.isPending}
                                onClick={() => setDraft(null)}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button disabled={!draft || updateMutation.isPending} onClick={() => void handleSave()}>
                                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('common.save')}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.permissions.api_title')}</CardTitle>
                    <CardDescription>{t('settings.permissions.api_description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('settings.permissions.api_column')}</TableHead>
                                    <TableHead>{t('settings.permissions.roles_column')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {API_PREVIEW_KEYS.map((key) => {
                                    const roles = RBAC_RULES[key] ?? []
                                    return (
                                        <TableRow key={key}>
                                            <TableCell className="font-mono text-xs">{key}</TableCell>
                                            <TableCell>{roles.length ? roles.join(', ') : '—'}</TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function MenuPermissionLabel({
    t,
    labelKey,
    sectionKey,
}: {
    t: (k: string) => string
    labelKey: string
    sectionKey: string
}) {
    return (
        <div>
            <div className="font-medium">{t(labelKey)}</div>
            <div className="text-xs text-muted-foreground">{t(sectionKey)}</div>
        </div>
    )
}

function buildWorkingItems(
    defaults: Record<string, TenantRole[]>,
    overrides: Record<string, TenantRole[]>,
): Record<string, TenantRole[]> {
    const out: Record<string, TenantRole[]> = {}
    for (const key of Object.keys(defaults)) {
        out[key] = overrides[key]?.length ? [...overrides[key]] : [...(defaults[key] ?? [])]
    }
    for (const key of Object.keys(overrides)) {
        if (!out[key] && overrides[key]?.length) out[key] = [...overrides[key]]
    }
    return out
}

function sameRoles(a: TenantRole[], b: TenantRole[]) {
    if (a.length !== b.length) return false
    const sa = [...a].sort().join(',')
    const sb = [...b].sort().join(',')
    return sa === sb
}
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppModal } from '@/components/common/AppModal'
import type { TenantAdmin } from '@/lib/api/query/tenantsAdmin'
import { TenantUsersTab } from '@/components/tenants/TenantUsersTab'
import { isValidTenantCode, stripTenantCodeInput } from '@/lib/tenantCode'

export type TenantFormValues = {
  code: string
  name: string
  is_active: boolean
  data_plane: 'shared' | 'dedicated'
  database_dsn_key: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  tenant?: TenantAdmin | null
  onSubmit: (values: TenantFormValues) => void
  isPending?: boolean
  defaultTab?: 'general' | 'users'
}

export function TenantFormDialog({
  open,
  onOpenChange,
  mode,
  tenant,
  onSubmit,
  isPending,
  defaultTab = 'general',
}: Props) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'general' | 'users'>(defaultTab)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [dataPlane, setDataPlane] = useState<'shared' | 'dedicated'>('shared')
  const [dsnKey, setDsnKey] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTab(defaultTab)
    if (mode === 'edit' && tenant) {
      setCode(tenant.code)
      setName(tenant.name)
      setIsActive(tenant.is_active)
      setDataPlane(tenant.data_plane === 'dedicated' ? 'dedicated' : 'shared')
      setDsnKey(tenant.database_dsn_key ?? '')
    } else {
      setCode('')
      setName('')
      setIsActive(true)
      setDataPlane('shared')
      setDsnKey('')
      setCodeError(null)
    }
  }, [open, mode, tenant, defaultTab])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'create' && !isValidTenantCode(code)) {
      setCodeError(t('tenants_admin.code_invalid'))
      return
    }
    setCodeError(null)
    onSubmit({
      code,
      name,
      is_active: isActive,
      data_plane: dataPlane,
      database_dsn_key: dsnKey.trim(),
    })
  }

  const tenantId = tenant?.id
  const canManageUsers = Boolean(tenantId)

  const title =
    mode === 'create' ? t('tenants_admin.create_title') : t('tenants_admin.edit_title')

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="xl"
      dismissible
    >
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'general' | 'users')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">{t('tenants_admin.tab_general')}</TabsTrigger>
          <TabsTrigger value="users" disabled={!canManageUsers}>
            {t('tenants_admin.tab_users')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {mode === 'create' && (
              <div className="space-y-2">
                <Label htmlFor="tenant-code">{t('tenants_admin.code')}</Label>
                <Input
                  id="tenant-code"
                  value={code}
                  onChange={(e) => {
                    setCode(stripTenantCodeInput(e.target.value))
                    setCodeError(null)
                  }}
                  placeholder={t('tenants_admin.code_placeholder')}
                  pattern="[a-z0-9_-]{2,32}"
                  required
                  autoComplete="off"
                />
                {codeError && (
                  <p className="text-xs text-destructive" role="alert">
                    {codeError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{t('tenants_admin.code_help')}</p>
              </div>
            )}
            {mode === 'edit' && (
              <div className="space-y-1">
                <Label>{t('tenants_admin.code')}</Label>
                <p className="text-sm font-mono">{tenant?.code}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="tenant-name">{t('tenants_admin.name')}</Label>
              <Input
                id="tenant-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={150}
              />
            </div>
            {mode === 'create' && (
              <>
                <div className="space-y-2">
                  <Label>{t('tenants_admin.data_plane')}</Label>
                  <Select
                    value={dataPlane}
                    onValueChange={(v) => setDataPlane(v as 'shared' | 'dedicated')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shared">{t('tenants_admin.data_plane_shared')}</SelectItem>
                      <SelectItem value="dedicated">{t('tenants_admin.data_plane_dedicated')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t('tenants_admin.data_plane_help')}</p>
                </div>
                {dataPlane === 'dedicated' && (
                  <div className="space-y-2">
                    <Label htmlFor="tenant-dsn-key">{t('tenants_admin.dsn_key')}</Label>
                    <Input
                      id="tenant-dsn-key"
                      value={dsnKey}
                      onChange={(e) => setDsnKey(e.target.value)}
                      placeholder="TENANT_DSN_ACME"
                      pattern="TENANT_DSN_[A-Z0-9_]+"
                      required
                      autoComplete="off"
                    />
                  </div>
                )}
              </>
            )}
            {mode === 'edit' && tenant?.data_plane === 'dedicated' && (
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-mono text-xs">{tenant.database_dsn_key}</p>
              </div>
            )}
            {mode === 'edit' && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="tenant-active">{t('tenants_admin.active')}</Label>
                <Switch id="tenant-active" checked={isActive} onCheckedChange={setIsActive} />
              </div>
            )}
            {mode === 'create' && (
              <p className="text-xs text-muted-foreground">{t('tenants_admin.tab_users_after_create')}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {mode === 'create' ? t('common.create') : t('common.save_changes')}
              </Button>
            </div>
          </form>
        </TabsContent>
        <TabsContent value="users" className="pt-2">
          {tenantId ? (
            <TenantUsersTab tenantId={tenantId} />
          ) : (
            <p className="text-sm text-muted-foreground py-4">{t('tenants_admin.tab_users_after_create')}</p>
          )}
        </TabsContent>
      </Tabs>
    </AppModal>
  )
}

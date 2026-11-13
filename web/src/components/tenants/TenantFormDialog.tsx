import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { TenantAdmin } from '@/lib/api/query/tenantsAdmin'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  tenant?: TenantAdmin | null
  onSubmit: (values: { code: string; name: string; is_active: boolean }) => void
  isPending?: boolean
}

export function TenantFormDialog({
  open,
  onOpenChange,
  mode,
  tenant,
  onSubmit,
  isPending,
}: Props) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && tenant) {
      setCode(tenant.code)
      setName(tenant.name)
      setIsActive(tenant.is_active)
    } else {
      setCode('')
      setName('')
      setIsActive(true)
    }
  }, [open, mode, tenant])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ code, name, is_active: isActive })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('tenants_admin.create_title') : t('tenants_admin.edit_title')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="tenant-code">{t('tenants_admin.code')}</Label>
              <Input
                id="tenant-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t('tenants_admin.code_placeholder')}
                pattern="[a-z0-9_-]{2,32}"
                required
                autoComplete="off"
              />
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
          {mode === 'edit' && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="tenant-active">{t('tenants_admin.active')}</Label>
              <Switch id="tenant-active" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {mode === 'create' ? t('common.create') : t('common.save_changes')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

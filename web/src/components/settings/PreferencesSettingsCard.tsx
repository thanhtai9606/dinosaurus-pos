import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRegionalSettingsQuery, useUpdateRegionalSettingsMutation, type RegionalSettings } from '@/lib/api/query/settings'
import { COMMON_TIMEZONES, DEFAULT_REGIONAL, formatRegionalDateTime } from '@/lib/datetime/regional'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function PreferencesSettingsCard() {
  const { t, i18n } = useTranslation()
  const { data, isLoading } = useRegionalSettingsQuery()
  const updateMut = useUpdateRegionalSettingsMutation()

  const [draft, setDraft] = useState<RegionalSettings>(DEFAULT_REGIONAL)

  useEffect(() => {
    if (data) setDraft(data)
  }, [data])

  const saveRegional = () => {
    updateMut.mutate(draft, {
      onSuccess: () => toast.success(t('settings.preferences.regional_saved')),
      onError: () => toast.error(t('settings.preferences.regional_save_failed')),
    })
  }

  const sample = formatRegionalDateTime(new Date(), draft, i18n.language?.split('-')[0] ?? 'en')

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.preferences.title')}</CardTitle>
        <CardDescription>{t('settings.preferences.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 max-w-lg">
        <div className="space-y-2">
          <Label>{t('settings.preferences.language')}</Label>
          <LanguageSwitcher />
        </div>
        <div className="space-y-2">
          <Label>{t('settings.preferences.theme')}</Label>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground">{t('settings.preferences.theme_help')}</span>
          </div>
        </div>

        <div className="space-y-4 border-t pt-6">
          <div>
            <h3 className="font-medium">{t('settings.preferences.regional_title')}</h3>
            <p className="text-sm text-muted-foreground">{t('settings.preferences.regional_description')}</p>
          </div>

          <div className="space-y-2">
            <Label>{t('settings.preferences.timezone')}</Label>
            <Select
              value={draft.timezone}
              onValueChange={(v) => setDraft((d) => ({ ...d, timezone: v }))}
              disabled={!updateMut.isAllowed || isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMON_TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('settings.preferences.date_style')}</Label>
              <Select
                value={draft.date_style}
                onValueChange={(v) => setDraft((d) => ({ ...d, date_style: v as RegionalSettings['date_style'] }))}
                disabled={!updateMut.isAllowed}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DMY">{t('settings.preferences.date_style_dmy')}</SelectItem>
                  <SelectItem value="MDY">{t('settings.preferences.date_style_mdy')}</SelectItem>
                  <SelectItem value="YMD">{t('settings.preferences.date_style_ymd')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('settings.preferences.time_style')}</Label>
              <Select
                value={draft.time_style}
                onValueChange={(v) => setDraft((d) => ({ ...d, time_style: v as RegionalSettings['time_style'] }))}
                disabled={!updateMut.isAllowed}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">{t('settings.preferences.time_style_24h')}</SelectItem>
                  <SelectItem value="12h">{t('settings.preferences.time_style_12h')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('settings.preferences.week_starts_on')}</Label>
            <Select
              value={draft.week_starts_on}
              onValueChange={(v) => setDraft((d) => ({ ...d, week_starts_on: v as RegionalSettings['week_starts_on'] }))}
              disabled={!updateMut.isAllowed}
            >
              <SelectTrigger className="sm:max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monday">{t('settings.preferences.week_monday')}</SelectItem>
                <SelectItem value="sunday">{t('settings.preferences.week_sunday')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground">
            {t('settings.preferences.regional_preview', { sample })}
          </p>

          {updateMut.isAllowed ? (
            <Button onClick={saveRegional} disabled={updateMut.isPending || isLoading}>
              {updateMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('settings.preferences.regional_save')}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">{t('settings.preferences.regional_admin_only')}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
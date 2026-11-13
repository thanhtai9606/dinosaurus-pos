import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useTranslation } from 'react-i18next'

export function PreferencesSettingsCard() {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.preferences.title')}</CardTitle>
        <CardDescription>{t('settings.preferences.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 max-w-md">
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
      </CardContent>
    </Card>
  )
}

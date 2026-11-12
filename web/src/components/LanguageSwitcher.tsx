import { useTranslation } from 'react-i18next'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
    const { t, i18n } = useTranslation()

    const handleLanguageChange = (value: string) => {
        void i18n.changeLanguage(value)
    }

    return (
        <Select value={i18n.language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-full gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder={t('common.language_placeholder')} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="id">{t('common.language_id')}</SelectItem>
                <SelectItem value="en">{t('common.language_en')}</SelectItem>
                <SelectItem value="vi">{t('common.language_vi')}</SelectItem>
            </SelectContent>
        </Select>
    )
}

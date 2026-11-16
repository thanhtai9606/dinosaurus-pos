import { format } from 'date-fns'
import { enUS, id as localeId, vi as localeVi } from 'date-fns/locale'
import type { Locale } from 'date-fns'

export type RegionalSettings = {
    timezone: string
    date_style: 'DMY' | 'MDY' | 'YMD'
    time_style: '24h' | '12h'
    week_starts_on: 'monday' | 'sunday'
}

export const DEFAULT_REGIONAL: RegionalSettings = {
    timezone: 'Asia/Ho_Chi_Minh',
    date_style: 'DMY',
    time_style: '24h',
    week_starts_on: 'monday',
}

let activeRegional: RegionalSettings = { ...DEFAULT_REGIONAL }
let activeLang = 'en'

/** Called from RegionalProvider so legacy `formatDate` in utils picks up tenant settings. */
export function setFormattingContext(regional: RegionalSettings, lang: string) {
    activeRegional = regional
    activeLang = lang.split('-')[0] || 'en'
}

export function getActiveRegional() {
    return activeRegional
}

export function formatActiveDate(value: Date | string | number) {
    return formatRegionalDate(value, activeRegional, activeLang)
}

export function formatActiveDateTime(value: Date | string | number) {
    return formatRegionalDateTime(value, activeRegional, activeLang)
}

export function formatActiveTime(value: Date | string | number) {
    return formatRegionalTime(value, activeRegional, activeLang)
}

export const COMMON_TIMEZONES = [
    'Asia/Ho_Chi_Minh',
    'Asia/Bangkok',
    'Asia/Jakarta',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Europe/London',
    'America/New_York',
    'America/Los_Angeles',
    'UTC',
] as const

function datePattern(style: RegionalSettings['date_style']): string {
    switch (style) {
        case 'MDY':
            return 'MM/dd/yyyy'
        case 'YMD':
            return 'yyyy-MM-dd'
        case 'DMY':
        default:
            return 'dd/MM/yyyy'
    }
}

function timePattern(style: RegionalSettings['time_style']): string {
    return style === '12h' ? 'h:mm a' : 'HH:mm'
}

export function dateFnsLocaleForLanguage(lang: string): Locale {
    if (lang === 'vi') return localeVi
    if (lang === 'id') return localeId
    return enUS
}

export function formatRegionalDate(
    value: Date | string | number,
    regional: RegionalSettings,
    lang: string,
) {
    return format(new Date(value), datePattern(regional.date_style), {
        locale: dateFnsLocaleForLanguage(lang),
    })
}

export function formatRegionalDateTime(
    value: Date | string | number,
    regional: RegionalSettings,
    lang: string,
) {
    const pattern = `${datePattern(regional.date_style)} ${timePattern(regional.time_style)}`
    return format(new Date(value), pattern, { locale: dateFnsLocaleForLanguage(lang) })
}

export function formatRegionalTime(
    value: Date | string | number,
    regional: RegionalSettings,
    lang: string,
) {
    return format(new Date(value), timePattern(regional.time_style), {
        locale: dateFnsLocaleForLanguage(lang),
    })
}
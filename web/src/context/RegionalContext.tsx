import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
    DEFAULT_REGIONAL,
    formatRegionalDate,
    formatRegionalDateTime,
    formatRegionalTime,
    setFormattingContext,
    type RegionalSettings,
} from '@/lib/datetime/regional'
import {
    regionalSettingsQueryKey,
    regionalSettingsQueryOptions,
} from '@/lib/api/query/settings'

type FormatDateFn = (value: Date | string | number) => string

export type RegionalContextValue = {
    regional: RegionalSettings
    timezone: string
    formatDate: FormatDateFn
    formatDateTime: FormatDateFn
    formatTime: FormatDateFn
    isLoading: boolean
}

const fallbackValue: RegionalContextValue = {
    regional: DEFAULT_REGIONAL,
    timezone: DEFAULT_REGIONAL.timezone,
    formatDate: (v) => formatRegionalDate(v, DEFAULT_REGIONAL, 'en'),
    formatDateTime: (v) => formatRegionalDateTime(v, DEFAULT_REGIONAL, 'en'),
    formatTime: (v) => formatRegionalTime(v, DEFAULT_REGIONAL, 'en'),
    isLoading: true,
}

const RegionalContext = createContext<RegionalContextValue>(fallbackValue)

export function RegionalProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient()
    const { i18n } = useTranslation()
    const lang = i18n.language?.split('-')[0] ?? 'en'

    const { data, isLoading, isFetching } = useQuery({
        ...regionalSettingsQueryOptions(),
        initialData: () =>
            queryClient.getQueryData<RegionalSettings>(regionalSettingsQueryKey),
        staleTime: 60_000,
    })

    const regional = data ?? DEFAULT_REGIONAL

    useEffect(() => {
        setFormattingContext(regional, lang)
    }, [regional, lang])

    const value = useMemo<RegionalContextValue>(
        () => ({
            regional,
            timezone: regional.timezone,
            formatDate: (v) => formatRegionalDate(v, regional, lang),
            formatDateTime: (v) => formatRegionalDateTime(v, regional, lang),
            formatTime: (v) => formatRegionalTime(v, regional, lang),
            isLoading: isLoading && !data && isFetching,
        }),
        [regional, lang, data, isLoading, isFetching],
    )

    return <RegionalContext.Provider value={value}>{children}</RegionalContext.Provider>
}

export function useRegional(): RegionalContextValue {
    return useContext(RegionalContext)
}

export function useFormatDate(): FormatDateFn {
    return useRegional().formatDate
}

export function useFormatDateTime(): FormatDateFn {
    return useRegional().formatDateTime
}

export function useFormatTime(): FormatDateFn {
    return useRegional().formatTime
}
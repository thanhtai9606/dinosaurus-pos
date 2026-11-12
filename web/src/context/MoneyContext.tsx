import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  formatMoney,
  formatMoneyAxisCompact,
  getCurrencySymbol,
} from '@/lib/utils'
import {
  financialSettingsQueryKey,
  financialSettingsQueryOptions,
  type FinancialSettings,
} from '@/lib/api/query/settings'

type FormatMoneyFn = (amount: number) => string

export type MoneyContextValue = {
  formatMoney: FormatMoneyFn
  formatAxisCompact: FormatMoneyFn
  currencyCode: string
  currencySymbol: string
  financialSettings: FinancialSettings | undefined
  isLoading: boolean
}

const loadingValue: MoneyContextValue = {
  formatMoney: (amount) => formatMoney(amount, 'IDR'),
  formatAxisCompact: (amount) => formatMoneyAxisCompact(amount, 'IDR'),
  currencyCode: 'IDR',
  currencySymbol: 'Rp',
  financialSettings: undefined,
  isLoading: true,
}

const MoneyContext = createContext<MoneyContextValue>(loadingValue)

export function MoneyProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { data, isLoading, isFetching } = useQuery({
    ...financialSettingsQueryOptions(),
    initialData: () =>
      queryClient.getQueryData<FinancialSettings>(financialSettingsQueryKey),
    // All dashboard roles need correct currency formatting (API allows any authenticated user).
    staleTime: 60_000,
  })

  const currency = (data?.currency ?? 'IDR').toUpperCase()
  const meta = data?.available_currencies?.find(
    (c) => c.code.toUpperCase() === currency,
  )
  const locale = meta?.locale

  const value = useMemo<MoneyContextValue>(
    () => ({
      formatMoney: (amount: number) =>
        formatMoney(amount, currency, locale, meta?.fraction_digits),
      formatAxisCompact: (amount: number) =>
        formatMoneyAxisCompact(amount, currency, locale),
      currencyCode: currency,
      currencySymbol: getCurrencySymbol(currency, locale),
      financialSettings: data,
      isLoading: isLoading && !data && isFetching,
    }),
    [currency, locale, meta?.fraction_digits, data, isLoading, isFetching],
  )

  return <MoneyContext.Provider value={value}>{children}</MoneyContext.Provider>
}

export function useMoney(): MoneyContextValue {
  return useContext(MoneyContext)
}

export function useFormatMoney(): FormatMoneyFn {
  return useMoney().formatMoney
}

export function useFormatMoneyAxis(): FormatMoneyFn {
  return useMoney().formatAxisCompact
}

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { formatMoney } from '@/lib/utils'
import { useFinancialSettingsQuery } from '@/lib/api/query/settings'

type FormatMoneyFn = (amount: number) => string

const defaultFormatter: FormatMoneyFn = (amount) => formatMoney(amount, 'IDR')

const MoneyContext = createContext<FormatMoneyFn>(defaultFormatter)

export function MoneyProvider({ children }: { children: ReactNode }) {
    const { data } = useFinancialSettingsQuery()
    const currency = data?.currency ?? 'IDR'
    const meta = data?.available_currencies?.find((c) => c.code === currency)
    const format = useMemo(
        () => (amount: number) =>
            formatMoney(amount, currency, meta?.locale, meta?.fraction_digits),
        [currency, meta?.locale, meta?.fraction_digits]
    )
    return <MoneyContext.Provider value={format}>{children}</MoneyContext.Provider>
}

export function useFormatMoney(): FormatMoneyFn {
    return useContext(MoneyContext)
}

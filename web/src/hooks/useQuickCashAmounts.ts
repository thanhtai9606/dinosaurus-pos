import { useMemo } from 'react'
import { useMoney } from '@/context/MoneyContext'
import { FALLBACK_POS_QUICK_CASH, type PosQuickCashSurface } from '@/lib/money/quickCash'

export function useQuickCashAmounts(surface: PosQuickCashSurface) {
    const { financialSettings, currencyCode } = useMoney()

    const amounts = useMemo(() => {
        const qc = financialSettings?.pos_quick_cash
        const list = surface === 'retail' ? qc?.retail : qc?.stock_receipt
        if (list?.length) return list
        return surface === 'retail'
            ? [...FALLBACK_POS_QUICK_CASH.retail]
            : [...FALLBACK_POS_QUICK_CASH.stock_receipt]
    }, [financialSettings?.pos_quick_cash, surface])

    const activeCurrency = financialSettings?.currency ?? currencyCode
    const fractionDigits = useMemo(
        () =>
            financialSettings?.available_currencies?.find(
                (c) => c.code.toUpperCase() === activeCurrency.toUpperCase(),
            )?.fraction_digits ?? 0,
        [activeCurrency, financialSettings?.available_currencies],
    )

    return { amounts, currencyCode: activeCurrency, fractionDigits }
}
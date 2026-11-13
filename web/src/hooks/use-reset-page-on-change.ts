import { useEffect } from 'react'

/** Reset list page when debounced filters / tabs change (pair with Zustand `resetPage`). */
export function useResetPageOnChange(resetPage: () => void, deps: readonly unknown[]) {
    useEffect(() => {
        resetPage()
        // eslint-disable-next-line react-hooks/exhaustive-deps -- explicit filter deps from caller
    }, deps)
}

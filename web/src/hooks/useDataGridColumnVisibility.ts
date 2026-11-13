import { useCallback, useEffect, useState } from 'react'

export function useDataGridColumnVisibility(
  columnIds: string[],
  defaultVisible: Record<string, boolean>,
  storageKey?: string,
) {
  const [visible, setVisible] = useState<Record<string, boolean>>(() => {
    if (storageKey) {
      try {
        const raw = localStorage.getItem(storageKey)
        if (raw) return { ...defaultVisible, ...JSON.parse(raw) }
      } catch {
        /* ignore */
      }
    }
    return defaultVisible
  })

  useEffect(() => {
    if (!storageKey) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(visible))
    } catch {
      /* ignore */
    }
  }, [visible, storageKey])

  const toggle = useCallback((id: string, next?: boolean) => {
    setVisible((prev) => ({ ...prev, [id]: next ?? !prev[id] }))
  }, [])

  const reset = useCallback(() => setVisible(defaultVisible), [defaultVisible])

  const visibleIds = columnIds.filter((id) => visible[id] !== false)

  return { visible, visibleIds, toggle, reset }
}

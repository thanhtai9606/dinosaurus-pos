import { useCallback, useEffect } from 'react'

export type KeyboardShortcut = {
    key: string
    ctrlKey?: boolean
    shiftKey?: boolean
    altKey?: boolean
    action: () => void
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return
            const target = event.target as HTMLElement
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return
            }

            const match = shortcuts.find((s) => {
                return (
                    s.key.toLowerCase() === event.key.toLowerCase() &&
                    !!s.ctrlKey === event.ctrlKey &&
                    !!s.shiftKey === event.shiftKey &&
                    !!s.altKey === event.altKey
                )
            })

            if (match) {
                event.preventDefault()
                match.action()
            }
        },
        [shortcuts, enabled]
    )

    useEffect(() => {
        if (!enabled) return
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown, enabled])
}

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react'

const STORAGE_KEY = 'theme'

type Theme = 'light' | 'dark' | 'system'
type Resolved = 'light' | 'dark'

type ThemeContextValue = {
    theme: Theme
    setTheme: (t: Theme) => void
    resolvedTheme: Resolved | undefined
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function systemPreference(): Resolved {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readStoredTheme(): Theme {
    try {
        const v = localStorage.getItem(STORAGE_KEY)
        if (v === 'light' || v === 'dark' || v === 'system') return v
    } catch {
        /* ignore */
    }
    return 'system'
}

function applyTheme(resolved: Resolved) {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolved)
    root.style.colorScheme = resolved
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => readStoredTheme())
    const [resolvedTheme, setResolvedTheme] = useState<Resolved | undefined>(undefined)

    const resolve = useCallback((t: Theme): Resolved => (t === 'system' ? systemPreference() : t), [])

    useEffect(() => {
        const resolved = resolve(theme)
        setResolvedTheme(resolved)
        applyTheme(resolved)
    }, [theme, resolve])

    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const onChange = () => {
            if (theme !== 'system') return
            const next = systemPreference()
            setResolvedTheme(next)
            applyTheme(next)
        }
        mq.addEventListener('change', onChange)
        return () => mq.removeEventListener('change', onChange)
    }, [theme])

    const setTheme = useCallback((next: Theme) => {
        setThemeState(next)
        try {
            localStorage.setItem(STORAGE_KEY, next)
        } catch {
            /* ignore */
        }
    }, [])

    const value = useMemo(
        () => ({ theme, setTheme, resolvedTheme }),
        [theme, setTheme, resolvedTheme],
    )

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useAppTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) {
        return {
            theme: 'system' as Theme,
            setTheme: () => {},
            resolvedTheme: undefined as Resolved | undefined,
        }
    }
    return ctx
}

/** Drop-in for `useTheme` from next-themes (subset used in this app). */
export function useTheme() {
    const { theme, setTheme, resolvedTheme } = useAppTheme()
    return {
        theme,
        setTheme,
        resolvedTheme,
        systemTheme: systemPreference(),
    }
}
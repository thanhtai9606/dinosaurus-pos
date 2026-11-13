import { ThemeToggle } from '@/components/ThemeToggle'

/** Compact chrome controls (theme only; language lives under Settings → Preferences). */
export function SettingsPanel() {
  return (
    <div className="flex items-center">
      <ThemeToggle />
    </div>
  )
}

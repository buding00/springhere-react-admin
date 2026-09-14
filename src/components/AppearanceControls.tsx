import { LanguageSwitch } from '@/components/LanguageSwitch.tsx'
import { ThemeSwitch } from '@/components/ThemeSwitch.tsx'

export function AppearanceControls({ className }: { className?: string }) {
  return (
    <div className={className ? `appearance-controls ${className}` : 'appearance-controls'}>
      <ThemeSwitch />
      <LanguageSwitch />
    </div>
  )
}

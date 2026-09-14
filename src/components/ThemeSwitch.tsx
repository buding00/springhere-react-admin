import { MoonOutlined, SunOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useI18n } from '@/locales/index.ts'
import { useThemeStore } from '@/store/theme.ts'
import { toggleThemeWithTransition } from '@/utils/themeTransition.ts'

export function ThemeSwitch({ className }: { className?: string }) {
  const { t } = useI18n()
  const mode = useThemeStore((state) => state.mode)
  const isDark = mode === 'dark'

  return (
    <Button
      type="text"
      className={className}
      aria-label={isDark ? t('common.lightTheme') : t('common.darkTheme')}
      icon={isDark ? <SunOutlined /> : <MoonOutlined />}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        toggleThemeWithTransition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        })
      }}
    />
  )
}

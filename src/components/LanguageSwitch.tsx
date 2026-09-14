import { Button } from 'antd'
import { useI18n } from '@/locales/index.ts'

export function LanguageSwitch({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n()
  const next = locale === 'zh-CN' ? 'en-US' : 'zh-CN'

  return (
    <Button
      type="text"
      className={className}
      aria-label={t('common.language')}
      onClick={() => setLocale(next)}
    >
      {locale === 'zh-CN' ? t('common.english') : t('common.chinese')}
    </Button>
  )
}

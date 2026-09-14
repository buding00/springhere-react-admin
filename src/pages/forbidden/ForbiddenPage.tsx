import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/locales/index.ts'

export function ForbiddenPage() {
  const navigate = useNavigate()
  const { t } = useI18n()

  return (
    <div className="grid h-full place-items-center">
      <Result
        status="403"
        title={t('forbidden.title')}
        subTitle={t('forbidden.subtitle')}
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            {t('forbidden.back')}
          </Button>
        }
      />
    </div>
  )
}

import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/locales/index.ts'

export function NotFoundPage() {
  const navigate = useNavigate()
  const { t } = useI18n()

  return (
    <div className="grid min-h-full place-items-center bg-surface px-4">
      <Result
        status="404"
        title={t('notFound.title')}
        subTitle={t('notFound.subtitle')}
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            {t('notFound.back')}
          </Button>
        }
      />
    </div>
  )
}

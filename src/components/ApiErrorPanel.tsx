import { Alert, Button } from 'antd'
import { mapApiError } from '@/api/client/index.ts'
import { useI18n } from '@/locales/index.ts'

export function ApiErrorPanel({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useI18n()
  const mapped = mapApiError(error)
  return (
    <div className="p-4">
      <Alert
        type={mapped.status === 403 ? 'warning' : 'error'}
        showIcon
        title={mapped.title}
        description={
          <div className="flex flex-col gap-3">
            <span>{mapped.description}</span>
            {onRetry ? (
              <div>
                <Button size="small" onClick={onRetry}>
                  {t('common.retry')}
                </Button>
              </div>
            ) : null}
          </div>
        }
      />
    </div>
  )
}

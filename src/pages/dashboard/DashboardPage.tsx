import { useI18n } from '@/locales/index.ts'
import { useAuth } from '@/store/auth.ts'

function greetingKey() {
  const hour = new Date().getHours()
  if (hour < 12) return 'dashboard.morning'
  if (hour < 18) return 'dashboard.afternoon'
  return 'dashboard.evening'
}

export function DashboardPage() {
  const { user } = useAuth()
  const { t } = useI18n()
  const isAdmin = user?.role === 'admin'
  const displayName = user?.remark || user?.email || ''

  return (
    <div className="dash">
      <header className="dash-hero">
        <h1>
          {t(greetingKey())}，{displayName}
        </h1>
        <p>{isAdmin ? t('dashboard.adminHint') : t('dashboard.userHint')}</p>
      </header>
      <dl className="dash-facts">
        <div>
          <dt>{t('dashboard.session')}</dt>
          <dd>{t('dashboard.signedIn')}</dd>
        </div>
        <div>
          <dt>{t('dashboard.accountRole')}</dt>
          <dd>{isAdmin ? t('role.admin') : t('role.user')}</dd>
        </div>
        <div className="dash-facts-wide">
          <dt>{t('dashboard.email')}</dt>
          <dd>{user?.email}</dd>
        </div>
      </dl>
    </div>
  )
}

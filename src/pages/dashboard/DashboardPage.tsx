import { SafetyCertificateOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'
import { Tag } from 'antd'
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

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <section className="rounded-xl border border-slate-200/80 bg-white px-6 py-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="m-0 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {t(greetingKey())}，{user?.remark || user?.email}
          </h1>
          <Tag color={isAdmin ? 'gold' : 'blue'}>{isAdmin ? t('role.admin') : t('role.user')}</Tag>
        </div>
        <p className="mt-2 mb-0 text-sm text-slate-500 dark:text-slate-400">{isAdmin ? t('dashboard.adminHint') : t('dashboard.userHint')}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200/80 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
            <SafetyCertificateOutlined />
          </div>
          <p className="m-0 text-xs text-slate-400">{t('dashboard.session')}</p>
          <p className="mt-1 mb-0 text-lg font-semibold text-slate-900 dark:text-slate-100">{t('dashboard.signedIn')}</p>
        </article>
        <article className="rounded-xl border border-slate-200/80 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <TeamOutlined />
          </div>
          <p className="m-0 text-xs text-slate-400">{t('dashboard.accountRole')}</p>
          <p className="mt-1 mb-0 text-lg font-semibold text-slate-900 dark:text-slate-100">{isAdmin ? t('role.admin') : t('role.user')}</p>
        </article>
        <article className="rounded-xl border border-slate-200/80 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <UserOutlined />
          </div>
          <p className="m-0 text-xs text-slate-400">{t('dashboard.email')}</p>
          <p className="mt-1 mb-0 truncate text-lg font-semibold text-slate-900 dark:text-slate-100">{user?.email}</p>
        </article>
      </section>
    </div>
  )
}

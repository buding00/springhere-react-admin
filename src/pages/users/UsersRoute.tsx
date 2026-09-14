import { lazy, Suspense } from 'react'
import { PageLoading } from '@/components/PageLoading.tsx'
import { useI18n } from '@/locales/index.ts'

const UsersPage = lazy(async () => ({ default: (await import('./UsersPage.tsx')).UsersPage }))

export function UsersRoute() {
  const { t } = useI18n()
  return (
    <Suspense fallback={<PageLoading label={t('users.loading')} />}>
      <UsersPage />
    </Suspense>
  )
}

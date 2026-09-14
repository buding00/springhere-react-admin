import { useEffect } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { Role } from '@/api/auth.ts'
import { PageLoading } from '@/components/PageLoading.tsx'
import { useI18n } from '@/locales/index.ts'
import { setAuthExpiredHandler, useAuth } from '@/store/auth.ts'

export function AuthExpiredListener() {
  const navigate = useNavigate()

  useEffect(() => {
    setAuthExpiredHandler(() => {
      navigate('/login', {
        replace: true,
        state: {
          expired: true,
          from: {
            pathname: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
          },
        },
      })
    })
    return () => setAuthExpiredHandler(null)
  }, [navigate])

  return <Outlet />
}

export function RequireAuth() {
  const { user, isLoading, sessionExpired } = useAuth()
  const location = useLocation()
  const { t } = useI18n()

  if (isLoading) return <PageLoading fullScreen label={t('login.restoringSession')} />
  if (user) return <Outlet />
  return <Navigate to="/login" replace state={{ from: location, expired: sessionExpired }} />
}

export function RequireRole({ roles }: { roles: Role[] }) {
  const { user } = useAuth()
  return user && roles.includes(user.role) ? <Outlet /> : <Navigate to="/403" replace />
}

export function RequireAdmin() {
  return <RequireRole roles={['admin']} />
}

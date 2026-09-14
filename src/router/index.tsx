import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/layout/AppShell.tsx'
import { DashboardPage } from '@/pages/dashboard/DashboardPage.tsx'
import { ForbiddenPage } from '@/pages/forbidden/ForbiddenPage.tsx'
import { LoginPage } from '@/pages/login/LoginPage.tsx'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage.tsx'
import { UsersRoute } from '@/pages/users/UsersRoute.tsx'
import { AuthExpiredListener, RequireAdmin, RequireAuth } from './guards.tsx'

export const router = createBrowserRouter([
  {
    element: <AuthExpiredListener />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppShell />,
            children: [
              { index: true, element: <Navigate to="/dashboard" replace /> },
              { path: '/dashboard', element: <DashboardPage /> },
              { path: '/403', element: <ForbiddenPage /> },
              { element: <RequireAdmin />, children: [{ path: '/users', element: <UsersRoute /> }] },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

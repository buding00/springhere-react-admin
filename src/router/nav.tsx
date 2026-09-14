import { DashboardOutlined, TeamOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'
import type { Role } from '@/api/auth.ts'

export type NavItem = {
  key: string
  labelKey: string
  roles: Role[]
  icon: ReactNode
}

export const navItems: NavItem[] = [
  { key: '/dashboard', labelKey: 'nav.dashboard', roles: ['admin', 'user'], icon: <DashboardOutlined /> },
  { key: '/users', labelKey: 'nav.users', roles: ['admin'], icon: <TeamOutlined /> },
]

export function navItemsForRole(role: Role | null | undefined) {
  if (!role) return []
  return navItems.filter((item) => item.roles.includes(role))
}

export function canAccessPath(pathname: string, role: Role | null | undefined) {
  const item = navItems.find((entry) => entry.key === pathname)
  if (!item) return Boolean(role)
  return Boolean(role && item.roles.includes(role))
}

export function pageTitle(pathname: string) {
  return navItems.find((item) => item.key === pathname)?.labelKey
}

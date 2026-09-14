import { LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { Avatar, Button, Dropdown, Layout, Menu } from 'antd'
import { useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppearanceControls } from '@/components/AppearanceControls.tsx'
import { useI18n } from '@/locales/index.ts'
import { navItemsForRole, pageTitle } from '@/router/nav.tsx'
import { useAuth } from '@/store/auth.ts'

const { Header, Sider, Content } = Layout

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, signOut } = useAuth()
  const { t } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()
  const menuItems = useMemo(
    () =>
      navItemsForRole(user?.role).map((item) => ({
        key: item.key,
        label: t(item.labelKey),
        icon: item.icon,
      })),
    [t, user?.role],
  )

  const signOutAndRedirect = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const displayName = user?.remark || user?.email || ''
  const titleKey = pageTitle(location.pathname)
  const headerTitle = titleKey ? t(titleKey) : location.pathname === '/403' ? t('forbidden.title') : t('common.appSubtitle')

  return (
    <Layout hasSider className="app-shell overflow-hidden">
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={220}
        theme="dark"
        breakpoint="lg"
        onBreakpoint={(broken) => setCollapsed(broken)}
        className="app-sider overflow-y-auto"
      >
        <div className={`app-brand ${collapsed ? 'px-3' : 'px-5'}`}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand text-sm font-extrabold text-white">
            S
          </span>
          {!collapsed && <span className="truncate text-[15px] font-semibold tracking-wide text-white">{t('common.appName')}</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="border-none bg-transparent px-2 pt-2"
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout className="app-shell-main">
        <Header className="app-header flex h-14 shrink-0 items-center gap-3 !px-4">
          <Button
            type="text"
            aria-label={t('nav.toggleSider')}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((value) => !value)}
          />
          <p className="m-0 min-w-0 truncate text-[15px] font-medium text-slate-800 dark:text-slate-100">{headerTitle}</p>
          <div className="flex-1" />
          <Dropdown
            menu={{
              items: [
                {
                  key: 'profile',
                  disabled: true,
                  label: (
                    <div className="py-1 pr-6">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{displayName}</div>
                      <div className="text-xs text-slate-400">{user?.email}</div>
                    </div>
                  ),
                },
                { type: 'divider' },
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: t('nav.logout'),
                  onClick: () => void signOutAndRedirect(),
                },
              ],
            }}
          >
            <button type="button" className="app-user-chip">
              <Avatar size={28} style={{ backgroundColor: '#1677ff', fontSize: 13 }}>
                {displayName.slice(0, 1).toUpperCase() || '?'}
              </Avatar>
              <span className="hidden max-w-32 truncate text-sm text-slate-700 dark:text-slate-200 sm:inline">{displayName}</span>
            </button>
          </Dropdown>
          <AppearanceControls />
        </Header>
        <Content className="app-shell-content min-h-0 flex-1 overflow-auto p-3">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

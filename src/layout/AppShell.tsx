import { LogoutOutlined, MenuFoldOutlined, MenuOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { Avatar, Button, ConfigProvider, Drawer, Dropdown, Layout, Menu, theme as antdTheme } from 'antd'
import type { MenuProps } from 'antd'
import { useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppearanceControls } from '@/components/AppearanceControls.tsx'
import { appConfig, localeText } from '@/config/index.ts'
import { useI18n } from '@/locales/index.ts'
import { navItemsForRole, pageTitle } from '@/router/nav.tsx'
import { useAuth } from '@/store/auth.ts'
import { useMediaQuery } from '@/utils/mediaQuery.ts'

const { Header, Sider, Content } = Layout

const siderTheme = {
  cssVar: { key: 'sider' },
  hashed: false,
  algorithm: antdTheme.darkAlgorithm,
  token: {
    colorPrimary: '#1a7a6d',
    colorBgBase: '#15211f',
    colorBgContainer: '#15211f',
    colorBgElevated: '#15211f',
    colorBgLayout: '#15211f',
    colorText: '#e4eeea',
    borderRadius: 10,
  },
  components: {
    Menu: {
      darkItemBg: '#15211f',
      itemBg: '#15211f',
      darkItemSelectedBg: '#1a7a6d',
      itemSelectedBg: '#1a7a6d',
      darkItemHoverBg: 'rgba(255,255,255,0.05)',
      itemHoverBg: 'rgba(255,255,255,0.05)',
      itemMarginInline: 8,
      itemBorderRadius: 10,
    },
  },
} as const

function SideNav({
  collapsed,
  selectedKey,
  items,
  onNavigate,
}: {
  collapsed: boolean
  selectedKey: string
  items: MenuProps['items']
  onNavigate: (key: string) => void
}) {
  return (
    <>
      <div className={`app-brand${collapsed ? ' is-collapsed' : ''}`}>
        <span className="app-brand-mark">{appConfig.mark}</span>
        {!collapsed && <span className="truncate text-[15px] font-semibold tracking-wide text-[#e4eeea]">{appConfig.name}</span>}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={items}
        className="app-sider-menu border-none bg-transparent"
        onClick={({ key }) => onNavigate(key)}
      />
    </>
  )
}

export function AppShell() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  const [collapsed, setCollapsed] = useState(isTablet)
  const [wasTablet, setWasTablet] = useState(isTablet)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { t, locale } = useI18n()
  const location = useLocation()
  const [navPath, setNavPath] = useState(location.pathname)
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

  if (isTablet !== wasTablet) {
    setWasTablet(isTablet)
    if (isTablet) setCollapsed(true)
  }
  if (location.pathname !== navPath) {
    setNavPath(location.pathname)
    if (mobileOpen) setMobileOpen(false)
  }
  if (!isMobile && mobileOpen) setMobileOpen(false)

  const signOutAndRedirect = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const goTo = (key: string) => {
    navigate(key)
    setMobileOpen(false)
  }

  const displayName = user?.remark || user?.email || ''
  const titleKey = pageTitle(location.pathname)
  const headerTitle = titleKey ? t(titleKey) : location.pathname === '/403' ? t('forbidden.title') : localeText(appConfig.subtitle, locale)

  return (
    <Layout hasSider={!isMobile} className="app-shell overflow-hidden">
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          width={220}
          collapsedWidth={80}
          theme="dark"
          className="app-sider overflow-y-auto"
        >
          <SideNav collapsed={collapsed} selectedKey={location.pathname} items={menuItems} onNavigate={goTo} />
        </Sider>
      )}
      <Layout className="app-shell-main">
        <Header className="app-header flex h-14 shrink-0 items-center gap-2">
          {isMobile ? (
            <Button
              type="text"
              className="app-header-trigger"
              aria-label={t('nav.openMenu')}
              icon={<MenuOutlined />}
              onClick={() => setMobileOpen(true)}
            />
          ) : (
            <Button
              type="text"
              className="app-header-trigger"
              aria-label={t('nav.toggleSider')}
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((value) => !value)}
            />
          )}
          <p className="m-0 min-w-0 truncate text-[15px] font-medium text-ink">{headerTitle}</p>
          <div className="flex-1" />
          <Dropdown
            menu={{
              items: [
                {
                  key: 'profile',
                  disabled: true,
                  label: (
                    <div className="py-1 pr-6">
                      <div className="font-medium text-ink">{displayName}</div>
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
              <Avatar size={28} style={{ backgroundColor: '#1a7a6d', fontSize: 13 }}>
                {displayName.slice(0, 1).toUpperCase() || '?'}
              </Avatar>
              <span className="hidden max-w-32 truncate text-sm text-ink sm:inline">{displayName}</span>
            </button>
          </Dropdown>
          <AppearanceControls />
        </Header>
        <Content className="app-shell-content min-h-0 flex-1 overflow-auto">
          <Outlet />
        </Content>
      </Layout>
      <ConfigProvider theme={siderTheme}>
        <Drawer
          placement="left"
          open={isMobile && mobileOpen}
          onClose={() => setMobileOpen(false)}
          size={200}
          closable={false}
          rootClassName="app-mobile-drawer"
          styles={{
            section: { background: '#15211f' },
            body: { padding: 0, background: '#15211f' },
          }}
        >
          <div className="app-sider h-full overflow-y-auto">
            <SideNav collapsed={false} selectedKey={location.pathname} items={menuItems} onNavigate={goTo} />
          </div>
        </Drawer>
      </ConfigProvider>
    </Layout>
  )
}

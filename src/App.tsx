import { App as AntApp, ConfigProvider, theme as antdTheme } from 'antd'
import enUS from 'antd/locale/en_US'
import zhCN from 'antd/locale/zh_CN'
import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from '@/api/queryClient.ts'
import { ApiMessageBinder } from '@/components/ApiMessageBinder.tsx'
import { RequestProgressBar } from '@/components/RequestProgressBar.tsx'
import { useI18n } from '@/locales/index.ts'
import { router } from '@/router/index.tsx'
import { useAuthStore } from '@/store/auth.ts'
import { useThemeStore } from '@/store/theme.ts'

export function App() {
  const { locale } = useI18n()
  const mode = useThemeStore((state) => state.mode)
  const isDark = mode === 'dark'

  useEffect(() => {
    void useAuthStore.getState().restoreSession()
  }, [])

  return (
    <ConfigProvider
      locale={locale === 'en-US' ? enUS : zhCN}
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          colorBgContainer: isDark ? '#0f172a' : '#ffffff',
          colorBgLayout: isDark ? '#0b1220' : '#f3f5f8',
          colorBorderSecondary: isDark ? '#1f2937' : '#e8edf3',
          fontFamily:
            '"PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif',
        },
        components: {
          Layout: {
            headerBg: isDark ? '#111827' : '#ffffff',
            siderBg: '#0f172a',
            bodyBg: isDark ? '#0b1220' : '#f3f5f8',
            headerHeight: 56,
          },
          Menu: {
            darkItemBg: '#0f172a',
            darkSubMenuItemBg: '#0f172a',
            darkItemSelectedBg: '#1677ff',
            darkItemHoverBg: 'rgba(255,255,255,0.06)',
            itemMarginInline: 8,
            itemBorderRadius: 8,
          },
          Table: {
            headerBg: isDark ? '#1e293b' : '#f8fafc',
            headerColor: isDark ? '#cbd5e1' : '#475569',
            headerSplitColor: 'transparent',
            rowHoverBg: isDark ? '#1e293b' : '#f8fbff',
            cellPaddingBlock: 12,
          },
          Button: {
            controlHeight: 36,
          },
        },
      }}
    >
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <ApiMessageBinder />
          <RequestProgressBar />
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  )
}

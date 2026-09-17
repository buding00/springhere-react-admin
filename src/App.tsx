import { App as AntApp, ConfigProvider, theme as antdTheme } from 'antd'
import enUS from 'antd/locale/en_US'
import zhCN from 'antd/locale/zh_CN'
import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from '@/api/queryClient.ts'
import { ApiMessageBinder } from '@/components/ApiMessageBinder.tsx'
import { RequestProgressBar } from '@/components/RequestProgressBar.tsx'
import { appConfig, localeText } from '@/config/index.ts'
import { useI18n } from '@/locales/index.ts'
import { router } from '@/router/index.tsx'
import { useAuthStore } from '@/store/auth.ts'
import { useThemeStore } from '@/store/theme.ts'

export function App() {
  const { locale } = useI18n()
  const mode = useThemeStore((state) => state.mode)
  const isDark = mode === 'dark'

  useEffect(() => {
    document.title = localeText(appConfig.documentTitle, locale)
  }, [locale])

  useEffect(() => {
    void useAuthStore.getState().restoreSession()
  }, [])

  return (
    <ConfigProvider
      locale={locale === 'en-US' ? enUS : zhCN}
      theme={{
        cssVar: {},
        hashed: false,
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1a7a6d',
          borderRadius: 10,
          colorBgContainer: isDark ? '#151e1c' : '#f6faf8',
          colorBgLayout: isDark ? '#101816' : '#eef3f1',
          colorBorderSecondary: isDark ? '#24332f' : '#cfdcd7',
          colorText: isDark ? '#e4eeea' : '#1a2a28',
          fontFamily:
            '"PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif',
        },
        components: {
          Layout: {
            headerBg: isDark ? '#151e1c' : '#f6faf8',
            siderBg: '#15211f',
            bodyBg: isDark ? '#101816' : '#eef3f1',
            headerHeight: 56,
          },
          Menu: {
            darkItemBg: '#15211f',
            darkSubMenuItemBg: '#15211f',
            darkItemSelectedBg: '#1a7a6d',
            darkItemHoverBg: 'rgba(255,255,255,0.05)',
            itemMarginInline: 8,
            itemBorderRadius: 10,
          },
          Table: {
            headerBg: isDark ? '#1b2623' : '#eef3f1',
            headerColor: isDark ? '#b7c9c3' : '#4d635e',
            headerSplitColor: 'transparent',
            rowHoverBg: isDark ? '#1b2623' : '#e7f1ed',
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

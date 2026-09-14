import { useCallback } from 'react'
import { useLocaleStore, type LocaleCode } from '@/store/locale.ts'
import { enUS } from './en-US.ts'
import { zhCN, type Messages } from './zh-CN.ts'

export type { LocaleCode, Messages }
export { enUS, zhCN }

const catalogs: Record<LocaleCode, Messages> = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

function lookup(messages: Messages, path: string): string {
  const value = path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, messages)
  return typeof value === 'string' ? value : path
}

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`))
}

export function getLocale() {
  return useLocaleStore.getState().locale
}

export function getMessages(locale: LocaleCode = getLocale()) {
  return catalogs[locale]
}

export function translate(path: string, vars?: Record<string, string | number>, locale: LocaleCode = getLocale()) {
  return interpolate(lookup(catalogs[locale], path), vars)
}

export function useI18n() {
  const locale = useLocaleStore((state) => state.locale)
  const setLocale = useLocaleStore((state) => state.setLocale)
  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) => translate(path, vars, locale),
    [locale],
  )

  return { t, locale, setLocale, messages: catalogs[locale] }
}

import { create } from 'zustand'

export type LocaleCode = 'zh-CN' | 'en-US'

const STORAGE_KEY = 'springhere-locale'

function readStoredLocale(): LocaleCode {
  if (typeof window === 'undefined') return 'zh-CN'
  const value = window.localStorage.getItem(STORAGE_KEY)
  return value === 'en-US' || value === 'zh-CN' ? value : 'zh-CN'
}

type LocaleStore = {
  locale: LocaleCode
  setLocale: (locale: LocaleCode) => void
}

export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: readStoredLocale(),
  setLocale: (locale) => {
    window.localStorage.setItem(STORAGE_KEY, locale)
    set({ locale })
  },
}))

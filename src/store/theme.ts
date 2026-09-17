import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'springhere-theme'

function readStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  const value = window.localStorage.getItem(STORAGE_KEY)
  return value === 'dark' || value === 'light' ? value : 'light'
}

function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', mode === 'dark')
  window.requestAnimationFrame(() => {
    document.documentElement.style.colorScheme = mode
  })
}

type ThemeStore = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: readStoredTheme(),
  setMode: (mode) => {
    window.localStorage.setItem(STORAGE_KEY, mode)
    applyTheme(mode)
    set({ mode })
  },
  toggleMode: () => {
    get().setMode(get().mode === 'dark' ? 'light' : 'dark')
  },
}))

applyTheme(useThemeStore.getState().mode)

import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { bindAuthClient, notifySessionExpired, refreshAccessToken } from '@/api/client/index.ts'
import { queryClient } from '@/api/queryClient.ts'
import { getCurrentUser, login, logout, type AuthUser, type LoginRequest } from '@/api/auth.ts'

type AuthStore = {
  user: AuthUser | null
  accessToken: string | null
  isLoading: boolean
  sessionExpired: boolean
  signIn: (input: LoginRequest) => Promise<void>
  signOut: () => Promise<void>
  restoreSession: () => Promise<void>
  clearSession: (expired?: boolean) => void
}

let authExpiredHandler: (() => void) | null = null

export function setAuthExpiredHandler(handler: (() => void) | null) {
  authExpiredHandler = handler
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  sessionExpired: false,

  signIn: async (input) => {
    const data = await login(input)
    set({
      accessToken: data.access_token,
      user: data.user,
      sessionExpired: false,
      isLoading: false,
    })
  },

  signOut: async () => {
    await logout().catch(() => undefined)
    get().clearSession(false)
  },

  restoreSession: async () => {
    set({ isLoading: true })
    const token = await refreshAccessToken()
    if (!token) {
      set({ accessToken: null, user: null, isLoading: false })
      return
    }
    try {
      set({
        accessToken: token,
        user: await getCurrentUser(),
        isLoading: false,
        sessionExpired: false,
      })
    } catch {
      get().clearSession(false)
    }
  },

  clearSession: (expired = false) => {
    const shouldNotify = expired && !get().sessionExpired
    set({
      accessToken: null,
      user: null,
      isLoading: false,
      sessionExpired: expired,
    })
    queryClient.clear()
    if (shouldNotify) notifySessionExpired()
  },
}))

bindAuthClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  setAccessToken: (accessToken) => {
    useAuthStore.setState({ accessToken })
  },
  onRefreshFailed: () => {
    useAuthStore.getState().clearSession(true)
    if (window.location.pathname !== '/login') authExpiredHandler?.()
  },
})

export function useAuth() {
  return useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isLoading: state.isLoading,
      sessionExpired: state.sessionExpired,
      signIn: state.signIn,
      signOut: state.signOut,
    })),
  )
}

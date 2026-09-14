import { apiClient } from '@/api/client'
import type { AuthUser, CaptchaData, LoginRequest, TokenData } from './types/auth.ts'

export type { AuthUser, CaptchaData, LoginRequest, Role, TokenData } from './types/auth.ts'

/** 获取登录图形验证码。 */
export async function getCaptcha() {
  const { data } = await apiClient.get<CaptchaData>('/api/v1/auth/captcha')
  return data
}

/** 使用账号、密码和验证码登录。 */
export async function login(input: LoginRequest) {
  const { data } = await apiClient.post<TokenData>('/api/v1/auth/login', {
    ...input,
    email: input.email.trim().toLowerCase(),
    captcha_id: input.captcha_id.trim(),
    captcha: input.captcha.trim(),
  })
  return data
}

/** 获取当前登录用户。 */
export async function getCurrentUser() {
  const { data } = await apiClient.get<AuthUser>('/api/v1/auth/me')
  return data
}

/** 使用 Refresh Cookie 换发新的 Access Token。 */
export async function refresh() {
  const { data } = await apiClient.post<TokenData>('/api/v1/auth/refresh', undefined, {
    skipProgress: true,
    skipErrorToast: true,
  })
  return data
}

/** 退出当前登录。 */
export async function logout() {
  const { data } = await apiClient.post<null>('/api/v1/auth/logout')
  return data
}

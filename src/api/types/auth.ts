import type { Role } from './common.ts'

export type { Role } from './common.ts'

/** 当前登录用户，不含密码。 */
export interface AuthUser {
  /** 用户 ID。 */
  id: string
  /** 邮箱，服务端按小写保存。 */
  email: string
  /** 备注名。 */
  remark: string
  /** 角色。 */
  role: Role
}

/** 登录图形验证码。 */
export interface CaptchaData {
  /** 验证码 ID，登录时原样回传。 */
  captcha_id: string
  /** PNG Data URL，可直接赋给 `img.src`。 */
  image: string
  /** 有效期，单位秒。 */
  expires_in: number
}

/** 登录请求体。 */
export interface LoginRequest {
  /** 邮箱。 */
  email: string
  /** 明文密码。 */
  password: string
  /** 来自 `/auth/captcha` 的验证码 ID。 */
  captcha_id: string
  /** 用户输入的验证码，默认 4 位，大小写不敏感。 */
  captcha: string
}

/** 登录和刷新接口返回的令牌数据。Refresh Token 只在 HttpOnly Cookie 中。 */
export interface TokenData {
  /** Access Token，放在内存里，请求头为 `Authorization: Bearer <token>`。 */
  access_token: string
  /** 令牌类型，固定为 Bearer。 */
  token_type: 'Bearer'
  /** Access Token 有效期，单位秒。 */
  expires_in: number
  /** 当前用户。 */
  user: AuthUser
}

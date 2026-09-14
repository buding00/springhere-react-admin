import type { AuthUser } from './auth.ts'
import type { PageData, Role } from './common.ts'

export type { Role } from './common.ts'

/** 用户管理中的用户，比登录用户多了状态、在线和时间字段。 */
export interface User extends AuthUser {
  /** 账号是否启用，存在 PostgreSQL。禁用后不能登录，现有登录会立即失效。 */
  active: boolean
  /**
   * 当前是否还有未过期的 Redis 登录会话。
   * 与 `active` 不是同一个意思：关了浏览器未退出时仍可能为 `true`，不是 IM 心跳。
   * 仅列表和详情会查 Redis 得到真实值；创建、修改、启停成功后固定为 `false`。
   */
  online: boolean
  /** 创建时间，RFC 3339。 */
  created_at: string
  /** 更新时间，RFC 3339。 */
  updated_at: string
}

/** 用户分页结果。 */
export type UserPage = PageData<User>

/** 用户列表查询参数。 */
export interface UserListParams {
  /** 页码，从 1 开始。 */
  page: number
  /** 每页条数，1 到 100。 */
  pageSize: number
  /** 邮箱模糊匹配。 */
  email?: string
  /** 按角色筛选。 */
  role?: Role
  /** 按启用状态筛选。 */
  active?: boolean
}

/** 创建用户请求体。 */
export interface CreateUserRequest {
  /** 邮箱，最大 254 字符，保存为小写。 */
  email: string
  /** 备注，最大 100 字符。 */
  remark: string
  /** 明文密码，8 到 72 字节。 */
  password: string
  /** 角色。 */
  role: Role
  /** 是否启用，省略时默认为 true。 */
  active?: boolean
}

/** 更新用户请求体。只传需要修改的字段。 */
export interface UpdateUserRequest {
  /** 邮箱。 */
  email?: string
  /** 备注。 */
  remark?: string
  /** 新密码。传入后该用户全部登录会立即失效。 */
  password?: string
  /** 角色。不能修改当前登录管理员自己的角色。 */
  role?: Role
}

/** 启用或禁用用户。 */
export interface SetUserStatusRequest {
  /** 目标状态。 */
  active: boolean
}

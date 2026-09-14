/** 用户角色。管理员可访问用户管理接口。 */
export type Role = 'admin' | 'user'

/** 业务错误码，对应响应里的 `reason`。 */
export type ApiErrorCode =
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR'
  | 'INVALID_CAPTCHA'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_REQUEST'
  | 'METHOD_NOT_ALLOWED'
  | 'NOT_FOUND'
  | 'PAYLOAD_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'ROUTE_NOT_FOUND'
  | 'SERVICE_UNAVAILABLE'
  | 'TOO_MANY_REQUESTS'
  | 'UNAUTHORIZED'
  | 'UNKNOWN'

/** 所有业务接口的统一响应包。成功时 `code` 为 0 且 `success` 为 true。 */
export interface ApiResponse<T> {
  /** 业务状态码。成功为 0，普通业务错误通常为 1000。 */
  code: number
  /** 提示文案。 */
  message: string
  /** 失败时的业务原因，用于前端分支。 */
  reason?: string
  /** 是否成功。 */
  success: boolean
  /** 成功时的业务数据；失败时一般为 null。 */
  data: T
}

/** 分页数据。位于统一响应的 `data` 内。 */
export interface PageData<T> {
  /** 当前页数据。 */
  data: T[]
  /** 总条数。 */
  total: number
  /** 当前页码，从 1 开始。 */
  page: number
  /** 每页条数。 */
  pageSize: number
}

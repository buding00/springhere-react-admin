import { apiClient } from './client/index.ts'
import type { CreateUserRequest, UpdateUserRequest, User, UserListParams, UserPage } from './types/users.ts'

export type { CreateUserRequest, Role, UpdateUserRequest, User, UserListParams, UserPage } from './types/users.ts'
export type UserFilters = UserListParams
export type CreateUserInput = CreateUserRequest
export type UpdateUserInput = UpdateUserRequest

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

/** 分页查询用户。本页 `online` 由 Redis 批量查询，失败时接口返回 503，不要把整页当成离线。 */
export async function listUsers(params: UserListParams) {
  const { data } = await apiClient.get<UserPage>('/api/v1/users', {
    params: {
      page: params.page,
      page_size: params.pageSize,
      email: params.email,
      role: params.role,
      active: params.active,
    },
  })
  return data
}

/** 创建用户。成功时 `online` 为 `false`。 */
export async function createUser(input: CreateUserRequest) {
  const { data } = await apiClient.post<User>('/api/v1/users', {
    ...input,
    email: normalizeEmail(input.email),
  })
  return data
}

/** 用户详情，含 Redis 查询得到的真实在线状态。 */
export async function getUser(id: string) {
  const { data } = await apiClient.get<User>(`/api/v1/users/${id}`)
  return data
}

/** 更新用户资料。成功后目标用户全部登录失效，返回的 `online` 为 `false`。 */
export async function updateUser(id: string, input: UpdateUserRequest) {
  const { data } = await apiClient.patch<User>(
    `/api/v1/users/${id}`,
    input.email ? { ...input, email: normalizeEmail(input.email) } : input,
  )
  return data
}

/** 启用或禁用用户。无论启停，现有登录都会失效，返回的 `online` 为 `false`。 */
export async function setUserStatus(id: string, active: boolean) {
  const { data } = await apiClient.patch<User>(`/api/v1/users/${id}/status`, { active })
  return data
}

/** 踢用户下线。只清 Redis Session，不返回 `User`。 */
export async function kickUser(id: string) {
  const { data } = await apiClient.post<null>(`/api/v1/users/${id}/kick`)
  return data
}

/** 删除用户。 */
export async function deleteUser(id: string) {
  const { data } = await apiClient.delete<null>(`/api/v1/users/${id}`)
  return data
}

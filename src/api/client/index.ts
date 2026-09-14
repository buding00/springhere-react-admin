import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { ApiErrorCode, ApiResponse } from '@/api/types/common.ts'
import { ApiError } from './errors.ts'
import { notifyApiError, resetApiMessageForTests } from './feedback.ts'
import { beginRequest, endRequest, resetRequestProgressForTests } from './requestProgress.ts'

export { ApiError, mapApiError, type ApiErrorCode, type MappedApiError } from './errors.ts'
export { bindApiMessage, notifyApiError, notifySessionExpired } from './feedback.ts'
export { bindLoadingBar, beginRequest, endRequest, getPendingRequestCount, resetRequestProgressForTests } from './requestProgress.ts'

type ErrorData = { error_code?: ApiErrorCode }

const apiErrorCodes = new Set<string>([
  'CONFLICT',
  'FORBIDDEN',
  'INTERNAL_ERROR',
  'INVALID_CAPTCHA',
  'INVALID_CREDENTIALS',
  'INVALID_REQUEST',
  'METHOD_NOT_ALLOWED',
  'NOT_FOUND',
  'PAYLOAD_TOO_LARGE',
  'RATE_LIMITED',
  'ROUTE_NOT_FOUND',
  'SERVICE_UNAVAILABLE',
  'TOO_MANY_REQUESTS',
  'UNAUTHORIZED',
  'UNKNOWN',
])

type AuthBridge = {
  getAccessToken: () => string | null
  setAccessToken: (token: string | null) => void
  onRefreshFailed: () => void
}

const sessionEndpoints = new Set([
  '/api/v1/auth/captcha',
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
])

const silentErrorEndpoints = new Set(['/api/v1/auth/captcha', '/api/v1/auth/login', '/api/v1/auth/refresh'])

let authBridge: AuthBridge = {
  getAccessToken: () => null,
  setAccessToken: () => undefined,
  onRefreshFailed: () => undefined,
}

let refreshRequest: Promise<string | null> | null = null

export function bindAuthClient(bridge: AuthBridge) {
  authBridge = bridge
}

export const apiClient = axios.create({
  timeout: 15_000,
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

export const api = apiClient

apiClient.interceptors.request.use((config) => {
  startProgress(config)
  if (isSessionEndpoint(config.url)) return config
  const token = authBridge.getAccessToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

apiClient.interceptors.response.use(
  (response) =>
    Promise.resolve(unwrapSuccess(response)).then(
      (value) => {
        endProgress(response.config)
        return value
      },
      (error) => {
        endProgress(response.config)
        return Promise.reject(error)
      },
    ),
  async (error: unknown) => {
    if (error instanceof ApiError) return Promise.reject(error)
    if (!axios.isAxiosError(error)) {
      const unknownError = new ApiError('请求未能完成。', 0, 'UNKNOWN', null)
      notifyIfNeeded(unknownError)
      return Promise.reject(unknownError)
    }

    const config = error.config as InternalAxiosRequestConfig | undefined
    if (config && shouldRefreshAccessToken(error, config)) {
      config._retry = true
      const token = await refreshAccessToken()
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`)
        return apiClient.request(config)
      }
      authBridge.onRefreshFailed()
      endProgress(config)
      return Promise.reject(toApiError(error))
    }

    if (config?._retry && isAccessTokenError(error)) {
      authBridge.onRefreshFailed()
      endProgress(config)
      return Promise.reject(toApiError(error))
    }

    endProgress(config)
    const apiError = toApiError(error)
    notifyIfNeeded(apiError, config)
    return Promise.reject(apiError)
  },
)

export function refreshAccessToken(): Promise<string | null> {
  if (!refreshRequest) {
    refreshRequest = import('@/api/auth.ts')
      .then(({ refresh }) => refresh())
      .then((data) => {
        authBridge.setAccessToken(data.access_token)
        return data.access_token
      })
      .catch(() => null)
      .finally(() => {
        refreshRequest = null
      })
  }
  return refreshRequest
}

export function resetAuthClientForTests() {
  refreshRequest = null
  resetRequestProgressForTests()
  resetApiMessageForTests()
  bindAuthClient({
    getAccessToken: () => null,
    setAccessToken: () => undefined,
    onRefreshFailed: () => undefined,
  })
}

function startProgress(config: InternalAxiosRequestConfig) {
  if (config.skipProgress || config._retry || config._progressStarted) return
  if (isRefreshEndpoint(config.url)) return
  config._progressStarted = true
  beginRequest()
}

function endProgress(config?: InternalAxiosRequestConfig) {
  if (!config?._progressStarted) return
  config._progressStarted = false
  endRequest()
}

function unwrapSuccess<T>(response: AxiosResponse<T>) {
  const body = response.data as ApiResponse<T> | T
  if (!isApiEnvelope(body)) return response
  if (isFailedEnvelope(body)) {
    const error = new ApiError(
      body.message || '请求未能完成。',
      response.status,
      readEnvelopeErrorCode(body, response.status),
      getRequestId(response.headers),
    )
    notifyIfNeeded(error, response.config)
    return Promise.reject(error)
  }
  response.data = body.data
  return response
}

function shouldRefreshAccessToken(error: AxiosError, config: InternalAxiosRequestConfig) {
  return !config._retry && !isSessionEndpoint(config.url) && isAccessTokenError(error)
}

function isAccessTokenError(error: AxiosError) {
  if (error.response?.status !== 401) return false
  return readErrorCode(error) === 'UNAUTHORIZED'
}

function isSessionEndpoint(url: string | undefined) {
  const path = (url ?? '').split('?')[0]
  return sessionEndpoints.has(path)
}

function isRefreshEndpoint(url: string | undefined) {
  return (url ?? '').split('?')[0] === '/api/v1/auth/refresh'
}

function isSilentErrorEndpoint(url: string | undefined) {
  return silentErrorEndpoints.has((url ?? '').split('?')[0])
}

function isApiEnvelope<T>(body: unknown): body is ApiResponse<T> {
  return typeof body === 'object' && body !== null && 'success' in body && 'data' in body && 'code' in body
}

function isFailedEnvelope(body: ApiResponse<unknown>) {
  return body.success === false || body.code !== 0
}

function readErrorCode(error: AxiosError): ApiErrorCode {
  const body = error.response?.data
  if (isApiEnvelope(body)) return readEnvelopeErrorCode(body, error.response?.status ?? 0)
  return fallbackErrorCode(error.response?.status ?? 0)
}

function readEnvelopeErrorCode(body: ApiResponse<unknown>, status: number): ApiErrorCode {
  if (isApiErrorCode(body.reason)) return body.reason
  const nested = (body.data as ErrorData | undefined)?.error_code
  if (isApiErrorCode(nested)) return nested
  return fallbackErrorCode(status)
}

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === 'string' && apiErrorCodes.has(value)
}

function toApiError(error: AxiosError) {
  if (!error.response) {
    return new ApiError('无法连接到服务，请检查网络或服务状态。', 0, 'UNKNOWN', null)
  }
  const body = error.response.data
  const message = isApiEnvelope(body) ? body.message : undefined
  return new ApiError(
    message || '请求未能完成。',
    error.response.status,
    readErrorCode(error),
    getRequestId(error.response.headers),
  )
}

function fallbackErrorCode(status: number): ApiErrorCode {
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 405) return 'METHOD_NOT_ALLOWED'
  if (status === 409) return 'CONFLICT'
  if (status === 413) return 'PAYLOAD_TOO_LARGE'
  if (status === 429) return 'TOO_MANY_REQUESTS'
  if (status === 500) return 'INTERNAL_ERROR'
  if (status === 503) return 'SERVICE_UNAVAILABLE'
  return 'UNKNOWN'
}

function getRequestId(headers: AxiosResponse['headers'] | undefined) {
  const value = headers?.['x-request-id']
  return typeof value === 'string' ? value : null
}

function notifyIfNeeded(error: ApiError, config?: InternalAxiosRequestConfig) {
  if (config?.skipErrorToast) return
  if (isSilentErrorEndpoint(config?.url)) return
  notifyApiError(error)
}

declare module 'axios' {
  interface AxiosRequestConfig {
    _retry?: boolean
    skipProgress?: boolean
    skipErrorToast?: boolean
    _progressStarted?: boolean
  }
}

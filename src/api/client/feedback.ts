import type { MessageInstance } from 'antd/es/message/interface'
import { translate } from '@/locales/index.ts'
import { ApiError } from './errors.ts'
import { mapApiError } from './errors.ts'

let messageApi: MessageInstance | null = null

export function bindApiMessage(api: MessageInstance | null) {
  messageApi = api
}

export function notifyApiError(error: unknown) {
  const mapped = mapApiError(error)
  if (error instanceof ApiError && error.requestId) {
    console.error('request failed', { requestId: error.requestId, code: error.code, status: error.status })
  }
  messageApi?.error(`${mapped.title}：${mapped.description}`)
}

export function notifySessionExpired() {
  messageApi?.warning(translate('login.expired'))
}

export function resetApiMessageForTests() {
  messageApi = null
}

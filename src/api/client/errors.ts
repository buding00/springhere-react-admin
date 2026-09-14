import { translate } from '@/locales/index.ts'
import type { ApiErrorCode } from '@/api/types/common.ts'

export type { ApiErrorCode }

export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly requestId: string | null

  constructor(message: string, status: number, code: ApiErrorCode, requestId: string | null) {
    super(message)
    this.status = status
    this.code = code
    this.requestId = requestId
  }
}

export type MappedApiError = {
  status: number
  code: ApiErrorCode
  title: string
  description: string
  requestId: string | null
}

export function mapApiError(error: unknown): MappedApiError {
  if (!(error instanceof ApiError)) {
    return {
      status: 0,
      code: 'UNKNOWN',
      title: translate('errors.UNKNOWN.title'),
      description: translate('errors.UNKNOWN.description'),
      requestId: null,
    }
  }

  const title = translate(`errors.${error.code}.title`)
  const description = translate(`errors.${error.code}.description`)
  return {
    status: error.status,
    code: error.code,
    title: title === `errors.${error.code}.title` ? translate('errors.UNKNOWN.title') : title,
    description:
      description === `errors.${error.code}.description`
        ? error.message || translate('errors.UNKNOWN.description')
        : description,
    requestId: error.requestId,
  }
}

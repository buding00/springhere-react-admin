import { notifyApiError } from '@/api/client/index.ts'

export function showRequestError(_message: unknown, error: unknown) {
  notifyApiError(error)
}

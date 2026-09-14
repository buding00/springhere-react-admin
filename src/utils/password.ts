import { translate } from '@/locales/index.ts'

export function passwordByteLength(value: string) {
  return new TextEncoder().encode(value).length
}

export function passwordByteRule(required: boolean) {
  return {
    validator: async (_: unknown, value?: string) => {
      if (!value) {
        if (required) throw new Error(translate('users.passwordRequired'))
        return
      }
      const length = passwordByteLength(value)
      if (length < 8 || length > 72) throw new Error(translate('users.passwordLength'))
    },
  }
}

import { App } from 'antd'
import { useEffect } from 'react'
import { bindApiMessage } from '@/api/client/index.ts'

export function ApiMessageBinder() {
  const { message } = App.useApp()

  useEffect(() => {
    bindApiMessage(message)
    return () => bindApiMessage(null)
  }, [message])

  return null
}

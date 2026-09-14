import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './client/index.ts'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && [401, 403, 429].includes(error.status)) return false
        return failureCount < 1
      },
    },
  },
})

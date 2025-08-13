import { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from './api/errors'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const message = getErrorMessage(error)
        if (
          message.toLowerCase().includes('unauthorized') ||
          message.toLowerCase().includes('forbidden')
        ) {
          return false
        }
        return failureCount < 2
      },
      throwOnError: false,
      onError: (error) => {
        toast.error(getErrorMessage(error))
      },
    },
    mutations: {
      onError: (error) => {
        toast.error(getErrorMessage(error))
      },
    },
  },
})



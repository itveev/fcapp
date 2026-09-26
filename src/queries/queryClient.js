import { QueryClient } from '@tanstack/vue-query'

export const FLOW_QUERY_KEY = ['flow']

export const queryClientConfig = {
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      networkMode: 'always',
      staleTime: Infinity,
      gcTime: 60 * 60 * 1000,
    },
  },
}

export function createQueryClient() {
  return new QueryClient(queryClientConfig)
}

export const queryClient = createQueryClient()

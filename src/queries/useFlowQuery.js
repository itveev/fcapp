import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { fetchFlow, saveFlow } from '../api/flowApi'
import { FLOW_QUERY_KEY } from './queryClient'

export function useFlowQuery() {
  return useQuery({
    queryKey: FLOW_QUERY_KEY,
    queryFn: fetchFlow,
  })
}

export function useSaveFlowMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveFlow,
    onSuccess(data) {
      queryClient.setQueryData(FLOW_QUERY_KEY, data)
    },
  })
}

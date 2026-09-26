import { watch } from 'vue'
import { normalizeNodes } from '../utils/normalize'
import { useFlowStore } from '../stores/flowStore'
import { useFlowQuery } from '../queries/useFlowQuery'

export function useFlowSync() {
  const store = useFlowStore()
  const query = useFlowQuery()

  watch(
    () => query.data.value,
    (payload) => {
      if (!payload || store.hydrated) return
      store.hydrate(normalizeNodes(payload))
    },
    { immediate: true },
  )

  return { query, store }
}

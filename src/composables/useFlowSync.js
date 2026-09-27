import { watch } from 'vue'
import { normalizeNodes } from '../utils/normalize'
import { useFlowStore } from '../stores/flowStore'
import { useFlowQuery } from '../queries/useFlowQuery'

export function useFlowSync() {
  const store = useFlowStore()
  const query = useFlowQuery()

  // Hydrate the editable domain state once from the server-state cache.
  // After that, Pinia owns the interactive workflow state.
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

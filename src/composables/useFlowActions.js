import { ref } from 'vue'
import { useFlowStore } from '../stores/flowStore'
import { useSaveFlowMutation } from '../queries/useFlowQuery'
import { serializeNodes } from '../utils/normalize'

export function useFlowActions() {
  const store = useFlowStore()
  const mutation = useSaveFlowMutation()
  const saveError = ref('')

  async function persist() {
    saveError.value = ''
    try {
      await mutation.mutateAsync(serializeNodes(store.nodeList))
    } catch {
      saveError.value = 'Could not save the workflow.'
    }
  }

  async function createNode(input, position) {
    if (mutation.isPending.value) return { ok: false, errors: [{ field: 'save', code: 'pending' }] }
    const result = store.createNode(input, position)
    if (result.ok) await persist()
    return result
  }

  async function updateNode(id, patch) {
    if (mutation.isPending.value) return { ok: false, errors: [{ field: 'save', code: 'pending' }] }
    const result = store.updateNode(id, patch)
    if (result.ok) await persist()
    return result
  }

  async function deleteNode(id) {
    const result = store.deleteNode(id)
    if (result.ok) await persist()
    return result
  }

  return { createNode, updateNode, deleteNode, saveError, saving: mutation.isPending }
}

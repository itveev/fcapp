import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFlowStore } from '../stores/flowStore'
import { resolveDrawer } from '../utils/drawerState'

export function useActiveNode() {
  const route = useRoute()
  const router = useRouter()
  const store = useFlowStore()

  const nodeId = computed(() => {
    const id = route.params.nodeId
    return typeof id === 'string' ? id : ''
  })

  const node = computed(() => (nodeId.value ? store.getNode(nodeId.value) : null))

  const drawer = computed(() => resolveDrawer({
    nodeId: nodeId.value,
    node: node.value,
    hydrated: store.hydrated,
  }))

  watch(drawer, (state) => {
    if (state.status === 'inaccessible') router.replace({ name: 'canvas' })
  })

  function close() {
    if (route.name !== 'canvas') router.push({ name: 'canvas' })
  }

  return { nodeId, node, drawer, close }
}

import { computed } from 'vue'
import { useFlowStore } from '../stores/flowStore'
import { createFlowEdges, createFlowNodes } from '../utils/flowAdapter'

export function useCanvasGraph() {
  const store = useFlowStore()
  const nodes = computed(() => createFlowNodes(store.nodeList, store.positions))
  const edges = computed(() => createFlowEdges(store.nodeList))

  function onDragStop({ node }) {
    if (!node?.id || !node.position) return
    store.setPosition(node.id, { x: node.position.x, y: node.position.y })
  }

  function openNode(router, node) {
    if (!node?.data?.accessible) return
    router.push({ name: 'node', params: { nodeId: node.id } })
  }

  function onNodeClick(router, { node }) {
    openNode(router, node)
  }

  function onNodeKeyDown(router, event) {
    const node = nodeFromActivationKey(event, nodes.value)
    if (!node) return
    event.preventDefault()
    openNode(router, node)
  }

  return { nodes, edges, onDragStop, onNodeClick, onNodeKeyDown }
}

export function nodeFromActivationKey(event, nodes) {
  if (event.key !== 'Enter' && event.key !== ' ') return null
  const target = event.target
  if (!target?.classList?.contains('vue-flow__node')) return null
  const node = nodes.find((item) => item.id === target.getAttribute('data-id'))
  if (!node?.data?.accessible) return null
  return node
}

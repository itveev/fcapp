<script setup>
import { nextTick, watch } from 'vue'
import { VueFlow } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import { useRoute, useRouter } from 'vue-router'
import { useCanvasGraph } from '../../composables/useCanvasGraph'
import { FLOW_ID, useFlowViewport } from '../../composables/useFlowViewport'
import { isNodeVisible } from '../../utils/nodeVisibility'
import WorkflowNode from './WorkflowNode.vue'
import BranchNode from './BranchNode.vue'

const route = useRoute()
const router = useRouter()
const { nodes, edges, onDragStop, onNodeClick, onNodeKeyDown } = useCanvasGraph()
const { findNode, setCenter, getViewport, vueFlowRef, flowToScreenCoordinate } = useFlowViewport()

function handleClick(payload) {
  onNodeClick(router, payload)
}

function handleKeyDown(event) {
  onNodeKeyDown(router, event)
}

function revealNode(nodeId) {
  const node = findNode(nodeId)
  const pane = vueFlowRef.value
  if (!node || !pane) return
  const rect = pane.getBoundingClientRect()
  const width = node.dimensions?.width || 220
  const height = node.dimensions?.height || 80
  const topLeft = flowToScreenCoordinate({ x: node.position.x, y: node.position.y })
  const visible = isNodeVisible({
    topLeft,
    size: { width, height },
    zoom: getViewport().zoom,
    bounds: rect,
  })
  if (visible) return
  setCenter(node.position.x + width / 2, node.position.y + height / 2, {
    duration: 200,
    zoom: getViewport().zoom,
  })
}

watch(() => route.params.nodeId, async (nodeId) => {
  if (typeof nodeId !== 'string' || !nodeId) return
  await nextTick()
  window.setTimeout(() => revealNode(nodeId), 220)
})
</script>

<template>
  <VueFlow
    :id="FLOW_ID"
    class="flow-canvas"
    :nodes="nodes"
    :edges="edges"
    :nodes-connectable="false"
    :edges-focusable="false"
    :delete-key-code="null"
    :fit-view-on-init="true"
    @node-drag-stop="onDragStop"
    @node-click="handleClick"
    @keydown="handleKeyDown"
  >
    <template #node-workflowCard="nodeProps">
      <WorkflowNode
        :data="nodeProps.data"
        :selected="nodeProps.selected || nodeProps.id === route.params.nodeId"
      />
    </template>
    <template #node-branchPill="nodeProps">
      <BranchNode :data="nodeProps.data" />
    </template>
  </VueFlow>
</template>

<style scoped>
.flow-canvas {
  flex: 1;
  min-width: 0;
  height: 100%;
  background-color: #f4f6f8;
  background-image: radial-gradient(#d5dbe3 1px, transparent 1px);
  background-size: 18px 18px;
}
</style>

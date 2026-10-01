<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useFlowSync } from '../composables/useFlowSync'
import { useActiveNode } from '../composables/useActiveNode'
import { useFlowActions } from '../composables/useFlowActions'
import { positionInViewport, useFlowViewport } from '../composables/useFlowViewport'
import FlowCanvas from '../components/flow/FlowCanvas.vue'
import NodeDetailsDrawer from '../components/drawer/NodeDetailsDrawer.vue'
import CreateNodeDialog from '../components/create/CreateNodeDialog.vue'

const { query } = useFlowSync()
const { node, drawer, close } = useActiveNode()
const { createNode, updateNode, deleteNode, saveError, saving } = useFlowActions()
const createOpen = ref(false)
const createSlot = ref(0)
const { screenToFlowCoordinate, vueFlowRef } = useFlowViewport()

const loading = computed(() => query.isPending.value && !query.data.value)
const loadError = computed(() => query.isLoadingError.value)
const drawerOpen = computed(() => drawer.value.status === 'open')

async function onCreate(input) {
  const position = positionInViewport(screenToFlowCoordinate, vueFlowRef.value, createSlot.value)
  createSlot.value += 1
  const result = await createNode(input, position)
  if (result.ok) createOpen.value = false
}

async function onSave(patch) {
  if (!node.value || saving.value) return
  await updateNode(node.value.id, patch)
}

function onEscape(event) {
  if (event.key !== 'Escape') return
  if (createOpen.value) {
    createOpen.value = false
    return
  }
  if (drawerOpen.value || drawer.value.status === 'missing') close()
}

onMounted(() => window.addEventListener('keydown', onEscape))
onBeforeUnmount(() => window.removeEventListener('keydown', onEscape))

async function onDelete() {
  if (!node.value) return
  const result = await deleteNode(node.value.id)
  if (result.ok) close()
}
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <h1>Flow Chart</h1>
      <button type="button" @click="createOpen = true">Create New Node</button>
    </header>
    <p v-if="saveError" class="banner" role="alert">{{ saveError }}</p>
    <p v-if="loading" class="banner">Loading workflow…</p>
    <p v-else-if="loadError" class="banner" role="alert">
      Couldn't load the workflow.
      <button type="button" @click="query.refetch()">Retry</button>
    </p>
    <div v-else class="workspace">
      <FlowCanvas />
      <NodeDetailsDrawer
        :open="drawerOpen"
        :missing="drawer.status === 'missing'"
        :node="node"
        :read-only="drawer.readOnly"
        :can-delete="drawer.canDelete"
        :saving="saving"
        @close="close"
        @delete="onDelete"
        @save="onSave"
      />
    </div>
    <Transition name="modal">
      <CreateNodeDialog v-if="createOpen" :saving="saving" @close="createOpen = false" @create="onCreate" />
    </Transition>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #d9dee7;
}

.app-header h1 {
  margin: 0;
  font-size: 18px;
}

.banner {
  margin: 0;
  padding: 8px 16px;
  background: #fff7e8;
}

.workspace {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
</style>

<script setup>
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { getNodeTypeMetadata } from '../../utils/flowAdapter'
import NodeIcon from './NodeIcon.vue'

const props = defineProps({
  data: { type: Object, required: true },
  selected: { type: Boolean, default: false },
})

const meta = computed(() => getNodeTypeMetadata(props.data.nodeType))
</script>

<template>
  <article class="workflow-card" :class="{ 'is-selected': selected, 'is-readonly': data.readOnly }">
    <Handle type="target" :position="Position.Top" :connectable="false" />
    <header>
      <NodeIcon :name="meta.icon" />
      <h2>{{ data.title }}</h2>
    </header>
    <p v-if="data.preview">{{ data.preview }}</p>
    <Handle type="source" :position="Position.Bottom" :connectable="false" />
  </article>
</template>

<style scoped>
.workflow-card {
  width: 220px;
  padding: 10px 12px;
  border: 1px solid #d5dbe3;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 2px rgb(16 24 40 / 6%);
}

.workflow-card.is-selected {
  border-color: #d35400;
}

.workflow-card header {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.workflow-card header h2 {
  min-width: 0;
}

.workflow-card h2 {
  margin: 0;
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workflow-card p {
  margin: 8px 0 0;
  color: #526070;
  font-size: 13px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

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

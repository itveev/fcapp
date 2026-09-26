<script setup>
import { Handle, Position } from '@vue-flow/core'

defineProps({
  data: { type: Object, required: true },
})
</script>

<template>
  <div class="branch-pill" :class="data.connectorType">
    <Handle type="target" :position="Position.Top" :connectable="false" />
    <span>{{ data.title }}</span>
    <Handle type="source" :position="Position.Bottom" :connectable="false" />
  </div>
</template>

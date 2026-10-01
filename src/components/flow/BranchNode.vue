<script setup>
import { Handle, Position } from '@vue-flow/core'

defineProps({
  data: { type: Object, required: true },
})
</script>

<template>
  <div class="branch-pill">
    <Handle type="target" :position="Position.Top" :connectable="false" />
    <span>{{ data.title }}</span>
    <Handle type="source" :position="Position.Bottom" :connectable="false" />
  </div>
</template>

<style scoped>
.branch-pill {
  min-width: 88px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #e8f1ff;
  color: #2458a6;
  text-align: center;
  font-size: 13px;
}
</style>

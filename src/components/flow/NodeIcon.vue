<script setup>
defineProps({
  name: { type: String, default: 'node' },
})
</script>

<template>
  <svg class="node-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path v-if="name === 'trigger'" d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
    <path v-else-if="name === 'message'" d="M4 5h16v10H7l-3 3V5z" />
    <path v-else-if="name === 'comment'" d="M5 4h14v12H8l-3 3V4z" />
    <path v-else-if="name === 'clock'" d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm1 5v4.2l3 1.8-.9 1.5L11 13V8h2z" />
    <circle v-else cx="12" cy="12" r="4" />
  </svg>
</template>

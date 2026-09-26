<script setup>
import { formatValidationError } from '../../utils/validation'

const props = defineProps({
  modelValue: { type: Object, required: true },
  errors: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

function update(comment) {
  emit('update:modelValue', { ...props.modelValue, comment })
}
</script>

<template>
  <section class="type-form">
    <div class="field" :class="{ 'is-invalid': errors.length }">
      <label for="node-comment">Comment</label>
      <textarea
        id="node-comment"
        class="message-text"
        :value="modelValue.comment"
        rows="4"
        :aria-invalid="errors.length ? true : undefined"
        :aria-describedby="errors.length ? 'error-comment-maxLength' : undefined"
        @input="update($event.target.value)"
      />
      <p v-for="error in errors" :id="`error-${error.field}-${error.code}`" :key="`${error.field}-${error.code}`" class="form-error" role="alert">
        {{ formatValidationError(error) }}
      </p>
    </div>
    <button class="button-outline" type="button" @click="update('')">Remove comment</button>
  </section>
</template>

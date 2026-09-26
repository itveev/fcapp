<script setup>
import { onMounted, reactive, ref } from 'vue'
import { USER_NODE_TYPES, getNodeTypeMetadata } from '../../utils/flowAdapter'
import { formatValidationError, validateCreateInput } from '../../utils/validation'

const props = defineProps({
  saving: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'create'])
const form = reactive({ title: '', description: '', type: 'sendMessage' })
const errors = ref([])
const titleInput = ref(null)

onMounted(() => titleInput.value?.focus())

function errorsFor(field) {
  return errors.value.filter((error) => error.field === field)
}

function errorId(error) {
  return `create-error-${error.field}-${error.code}`
}

function describedBy(field) {
  const list = errorsFor(field)
  return list.length ? list.map(errorId).join(' ') : undefined
}

function invalid(field) {
  return errorsFor(field).length ? true : undefined
}

function submit() {
  if (props.saving) return
  errors.value = validateCreateInput(form)
  if (errors.value.length) return
  emit('create', {
    title: form.title,
    description: form.description,
    type: form.type,
  })
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')" @keydown.esc="emit('close')">
    <form class="modal" role="dialog" aria-modal="true" aria-labelledby="create-title" @submit.prevent="submit">
      <h2 id="create-title">Create New Node</h2>
      <div class="field" :class="{ 'is-invalid': invalid('title') }">
        <label for="create-title-field">Title</label>
        <input
          id="create-title-field"
          ref="titleInput"
          v-model="form.title"
          name="title"
          type="text"
          :aria-invalid="invalid('title')"
          :aria-describedby="describedBy('title')"
        />
        <p v-for="error in errorsFor('title')" :id="errorId(error)" :key="errorId(error)" class="form-error" role="alert">
          {{ formatValidationError(error) }}
        </p>
      </div>
      <div class="field" :class="{ 'is-invalid': invalid('description') }">
        <label for="create-description">Description</label>
        <input
          id="create-description"
          v-model="form.description"
          name="description"
          type="text"
          :aria-invalid="invalid('description')"
          :aria-describedby="describedBy('description')"
        />
        <p v-for="error in errorsFor('description')" :id="errorId(error)" :key="errorId(error)" class="form-error" role="alert">
          {{ formatValidationError(error) }}
        </p>
      </div>
      <div class="field" :class="{ 'is-invalid': invalid('type') }">
        <label for="create-type">Type</label>
        <select
          id="create-type"
          v-model="form.type"
          name="type"
          :aria-invalid="invalid('type')"
          :aria-describedby="describedBy('type')"
        >
          <option v-for="type in USER_NODE_TYPES" :key="type" :value="type">
            {{ getNodeTypeMetadata(type).label }}
          </option>
        </select>
        <p v-for="error in errorsFor('type')" :id="errorId(error)" :key="errorId(error)" class="form-error" role="alert">
          {{ formatValidationError(error) }}
        </p>
      </div>
      <div class="modal-actions">
        <button class="button-ghost" type="button" @click="emit('close')">Cancel</button>
        <button class="button-primary" type="submit" :disabled="saving">Create node</button>
      </div>
    </form>
  </div>
</template>

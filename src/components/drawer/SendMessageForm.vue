<script setup>
import { onBeforeUnmount } from 'vue'
import { createLocalAttachment, isImageAttachment, replaceAttachment, revokeUrls, urlsToRevoke } from '../../utils/attachments'
import { formatValidationError } from '../../utils/validation'

const props = defineProps({
  modelValue: { type: Object, required: true },
  persistedPayload: { type: Array, default: () => [] },
  errors: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])
const createdUrls = new Set()

function payload() {
  return props.modelValue.payload || []
}

function commit(nextPayload) {
  emit('update:modelValue', { ...props.modelValue, payload: nextPayload })
}

function keptUrls(nextPayload, includePersisted) {
  const items = includePersisted ? [...nextPayload, ...props.persistedPayload] : nextPayload
  return new Set(items.filter((item) => item?.type === 'attachment').map((item) => item.url))
}

function releaseAbandoned(url, nextPayload) {
  const abandoned = urlsToRevoke(createdUrls, keptUrls(nextPayload, true))
  if (!abandoned.includes(url)) return
  revokeUrls([url])
  createdUrls.delete(url)
}

function updateText(index, text) {
  commit(payload().map((item, itemIndex) => (itemIndex === index ? { ...item, text } : item)))
}

function removeAt(index) {
  const removed = payload()[index]
  const next = payload().filter((_, itemIndex) => itemIndex !== index)
  if (removed?.kind === 'local') releaseAbandoned(removed.url, next)
  commit(next)
}

function onFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  const attachment = createLocalAttachment(file)
  createdUrls.add(attachment.url)
  const previous = payload().find((item) => item.type === 'attachment')
  const next = replaceAttachment(payload(), attachment)
  if (previous?.kind === 'local') releaseAbandoned(previous.url, next)
  commit(next)
}

onBeforeUnmount(() => {
  revokeUrls(urlsToRevoke(createdUrls, keptUrls([], true)))
})

function errorsFor(field) {
  return props.errors.filter((error) => error.field === field)
}

function errorId(error) {
  return `error-${error.field}-${error.code}`
}
</script>

<template>
  <section class="type-form">
    <div v-for="(item, index) in modelValue.payload" :key="index" class="payload-item">
      <template v-if="item.type === 'text'">
        <div class="field" :class="{ 'is-invalid': errorsFor('text').length }">
          <label :for="`message-text-${index}`">Text</label>
          <textarea
            :id="`message-text-${index}`"
            class="message-text"
            :value="item.text"
            rows="4"
            :aria-invalid="errorsFor('text').length ? true : undefined"
            :aria-describedby="errorsFor('text').length ? errorsFor('text').map(errorId).join(' ') : undefined"
            @input="updateText(index, $event.target.value)"
          />
          <template v-if="index === modelValue.payload.findIndex((entry) => entry.type === 'text')">
            <p v-for="error in errorsFor('text')" :id="errorId(error)" :key="errorId(error)" class="form-error" role="alert">
              {{ formatValidationError(error) }}
            </p>
          </template>
        </div>
        <button class="button-outline" type="button" @click="removeAt(index)">Remove text</button>
      </template>
      <template v-else-if="item.type === 'attachment'">
        <img v-if="isImageAttachment(item)" class="attachment-preview" :src="item.url" :alt="item.name || 'Attachment preview'" />
        <p class="attachment-name" :title="item.name || item.url">{{ item.name || item.url }}</p>
        <button class="button-outline" type="button" @click="removeAt(index)">Remove attachment</button>
      </template>
    </div>
    <div class="file-picker" :class="{ 'is-invalid': errorsFor('attachment').length }">
      <span class="field-label">{{ modelValue.payload?.some((item) => item.type === 'attachment') ? 'Replace attachment' : 'Attachment' }}</span>
      <input id="message-file" class="file-input" type="file" :aria-invalid="errorsFor('attachment').length ? true : undefined" :aria-describedby="errorsFor('attachment').length ? errorsFor('attachment').map(errorId).join(' ') : undefined" @change="onFile" />
      <label class="button-outline" for="message-file">Choose file</label>
    </div>
    <p v-for="error in errorsFor('attachment')" :id="errorId(error)" :key="errorId(error)" class="form-error" role="alert">
      {{ formatValidationError(error) }}
    </p>
  </section>
</template>

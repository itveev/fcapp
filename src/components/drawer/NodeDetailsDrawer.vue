<script setup>
import { computed, ref, watch } from 'vue'
import { getNodeTypeMetadata } from '../../utils/flowAdapter'
import { formatValidationError, validateNode } from '../../utils/validation'
import NodeIcon from '../flow/NodeIcon.vue'
import SendMessageForm from './SendMessageForm.vue'
import CommentForm from './CommentForm.vue'
import BusinessHoursForm from './BusinessHoursForm.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  node: { type: Object, default: null },
  readOnly: { type: Boolean, default: false },
  canDelete: { type: Boolean, default: false },
  missing: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'delete', 'save'])
const confirming = ref(false)
const draft = ref(null)
const errors = ref([])
const meta = computed(() => getNodeTypeMetadata(props.node?.type))
const showType = computed(() => {
  const title = props.node?.title?.trim().toLowerCase()
  const label = meta.value.label?.trim().toLowerCase()
  return Boolean(label && label !== title)
})

function syncDraft(node) {
  draft.value = {
    title: node.title,
    description: node.description || '',
    data: JSON.parse(JSON.stringify(node.data)),
  }
  errors.value = []
  confirming.value = false
}

watch(() => props.node?.id, () => {
  if (props.node) syncDraft(props.node)
}, { immediate: true })

function errorsFor(field) {
  return errors.value.filter((error) => error.field === field)
}

function errorId(error) {
  return `error-${error.field}-${error.code}`
}

function describedBy(field) {
  const list = errorsFor(field)
  return list.length ? list.map(errorId).join(' ') : undefined
}

function invalid(field) {
  return errorsFor(field).length ? true : undefined
}

function save() {
  if (props.saving || !props.node || !draft.value) return
  const next = {
    ...props.node,
    title: draft.value.title,
    description: draft.value.description,
    data: draft.value.data,
  }
  errors.value = validateNode(next)
  if (errors.value.length) return
  emit('save', {
    title: draft.value.title,
    description: draft.value.description,
    data: draft.value.data,
  })
}
</script>

<template>
  <Transition name="drawer">
  <aside v-if="open || missing" class="drawer">
    <div class="drawer-slide">
    <div v-if="missing" class="drawer-body">
      <header class="drawer-header">
        <h2>Node not found</h2>
        <button class="button-ghost" type="button" aria-label="Close details" @click="emit('close')">Close</button>
      </header>
      <div class="drawer-scroll">
        <p>This step does not exist.</p>
      </div>
    </div>
    <div v-else-if="node && draft" class="drawer-body">
      <header class="drawer-header">
        <div class="drawer-heading">
          <NodeIcon :name="meta.icon" />
          <div class="drawer-titles">
            <h2>{{ node.title }}</h2>
            <p v-if="showType" class="type-label">{{ meta.label }}</p>
          </div>
        </div>
        <button class="button-ghost" type="button" aria-label="Close details" @click="emit('close')">Close</button>
      </header>
      <form v-if="!readOnly" :key="node.id" class="edit-form" @submit.prevent="save">
        <div class="drawer-scroll">
          <div class="field" :class="{ 'is-invalid': invalid('title') }">
            <label for="node-title">Title</label>
            <input
              id="node-title"
              v-model="draft.title"
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
            <label for="node-description">Description</label>
            <textarea
              id="node-description"
              v-model="draft.description"
              name="description"
              rows="3"
              :aria-invalid="invalid('description')"
              :aria-describedby="describedBy('description')"
            />
            <p v-for="error in errorsFor('description')" :id="errorId(error)" :key="errorId(error)" class="form-error" role="alert">
              {{ formatValidationError(error) }}
            </p>
          </div>
          <SendMessageForm
            v-if="node.type === 'sendMessage'"
            v-model="draft.data"
            :persisted-payload="node.data.payload"
            :errors="errors"
          />
          <CommentForm v-else-if="node.type === 'addComment'" v-model="draft.data" :errors="errors" />
          <BusinessHoursForm v-else-if="node.type === 'businessHours'" v-model="draft.data" :errors="errors" />
        </div>
        <div class="drawer-footer">
          <div class="drawer-footer-side">
            <button v-if="canDelete && !confirming" class="button-danger" type="button" @click="confirming = true">Delete node</button>
            <template v-else-if="canDelete">
              <span>Delete this node?</span>
              <button class="button-danger" type="button" @click="emit('delete')">Confirm delete</button>
              <button class="button-ghost" type="button" @click="confirming = false">Cancel</button>
            </template>
          </div>
          <button class="button-primary" type="submit" :disabled="saving">Save</button>
        </div>
      </form>
      <div v-else class="drawer-scroll">
        <p>This step is read-only.</p>
        <p v-if="node.description">{{ node.description }}</p>
      </div>
    </div>
    </div>
  </aside>
  </Transition>
</template>

<style scoped>
.drawer {
  display: flex;
  flex: none;
  flex-direction: column;
  box-sizing: border-box;
  width: min(420px, 42vw);
  min-width: 0;
  height: 100%;
  overflow: hidden;
  background: #fff;
  border-left: 1px solid var(--line);
}

.drawer-slide,
.drawer-body {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
}

.drawer-enter-active .drawer-slide,
.drawer-leave-active .drawer-slide {
  transition: transform 180ms ease-out, opacity 180ms ease-out;
}

.drawer-leave-active .drawer-slide {
  transition-duration: 140ms;
}

.drawer-enter-from .drawer-slide,
.drawer-leave-to .drawer-slide {
  opacity: 0;
  transform: translateX(16px);
}

.drawer-header,
.drawer-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drawer-header {
  justify-content: space-between;
  flex: none;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line);
}

.drawer-heading,
.drawer-titles {
  display: flex;
  min-width: 0;
}

.drawer-heading {
  align-items: center;
  gap: 8px;
  flex: 1;
}

.drawer-titles {
  flex-direction: column;
  gap: 2px;
}

.drawer-header h2 {
  min-width: 0;
  margin: 0;
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-label {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.drawer-scroll {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px;
}

.edit-form {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.drawer-footer {
  flex: none;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-top: 1px solid var(--line);
}

.drawer-footer-side {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--muted);
  font-size: 13px;
}

@media (prefers-reduced-motion: reduce) {
  .drawer-enter-active .drawer-slide,
  .drawer-leave-active .drawer-slide {
    transition: none;
  }
}
</style>

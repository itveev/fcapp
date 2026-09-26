import { flushPromises, mount } from '@vue/test-utils'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetFlowApi } from '../api/flowApi'
import { seed } from '../data/seed'
import { createQueryClient } from '../queries/queryClient'
import { routes } from '../router'
import { useFlowStore } from '../stores/flowStore'
import FlowView from './FlowView.vue'

async function mountAt(path) {
  resetFlowApi(seed)
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(FlowView, {
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient: createQueryClient() }], router],
      stubs: { FlowCanvas: { template: '<div data-testid="canvas" />' } },
    },
  })
  await flushPromises()
  return { wrapper, router, store: useFlowStore() }
}

describe('FlowView drawer routing', () => {
  beforeEach(() => {
    resetFlowApi(seed)
  })

  it('opens the deep-linked node after hydration', async () => {
    const { wrapper } = await mountAt('/nodes/b6a0c1')
    expect(wrapper.get('[data-testid="canvas"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Away Message')
    expect(wrapper.text()).toContain('Delete')
  })

  it('shows the trigger as read-only', async () => {
    const { wrapper } = await mountAt('/nodes/1')
    expect(wrapper.text()).toContain('This step is read-only.')
    expect(wrapper.text()).not.toContain('Delete')
    expect(wrapper.find('input[name="title"]').exists()).toBe(false)
  })

  it('saves an edit and discards a draft when the drawer closes', async () => {
    const { wrapper, store, router } = await mountAt('/nodes/b6a0c1')
    expect(wrapper.find('textarea').exists()).toBe(true)
    await wrapper.get('input[name="title"]').setValue('Temporary')
    await wrapper.get('button[aria-label="Close details"]').trigger('click')
    await flushPromises()
    expect(store.getNode('b6a0c1').title).toBe('Away Message')
    await router.push('/nodes/b6a0c1')
    await flushPromises()
    await wrapper.get('input[name="title"]').setValue('Saved away')
    await wrapper.get('form.edit-form').trigger('submit')
    await flushPromises()
    expect(store.getNode('b6a0c1').title).toBe('Saved away')
  })

  it('reloads the draft when the open node changes', async () => {
    const { wrapper, router } = await mountAt('/nodes/b6a0c1')
    await wrapper.get('input[name="title"]').setValue('Temporary')
    await router.push('/nodes/e879e4')
    await flushPromises()
    expect(wrapper.get('input[name="title"]').element.value).toBe('Add Comment #1')
    expect(wrapper.text()).toContain('Remove comment')
  })

  it('returns an inaccessible branch to the canvas', async () => {
    const { wrapper, router } = await mountAt('/nodes/161f52')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
    expect(wrapper.text()).not.toContain('Success')
  })

  it('shows a missing node without crashing and closes back to /', async () => {
    const { wrapper, router } = await mountAt('/nodes/missing')
    expect(wrapper.text()).toContain('Node not found')
    await wrapper.get('button[aria-label="Close details"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('deletes the open node and closes the drawer', async () => {
    const { wrapper, router } = await mountAt('/nodes/b6a0c1')
    const deleteButton = wrapper.findAll('button').find((button) => button.text() === 'Delete node')
    await deleteButton.trigger('click')
    const confirm = wrapper.findAll('button').find((button) => button.text() === 'Confirm delete')
    await confirm.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
    expect(wrapper.text()).not.toContain('Away Message')
  })

  it('creates a standalone node from the form', async () => {
    const { wrapper, store } = await mountAt('/')
    const create = wrapper.findAll('button').find((button) => button.text() === 'Create New Node')
    await create.trigger('click')
    await wrapper.get('input[name="title"]').setValue('Night note')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    const created = store.nodeList.find((node) => node.title === 'Night note')
    expect(created?.parentId).toBeNull()
    expect(store.rootIds).toContain(created.id)
  })
})

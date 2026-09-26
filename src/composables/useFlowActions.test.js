import { flushPromises, mount } from '@vue/test-utils'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { fetchFlow, resetFlowApi } from '../api/flowApi'
import { seed } from '../data/seed'
import { createQueryClient } from '../queries/queryClient'
import { useFlowStore } from '../stores/flowStore'
import { normalizeNodes } from '../utils/normalize'
import { createFlowEdges } from '../utils/flowAdapter'
import { useFlowActions } from './useFlowActions'

const Harness = defineComponent({
  setup() {
    return useFlowActions()
  },
  template: '<div />',
})

describe('useFlowActions', () => {
  beforeEach(() => {
    resetFlowApi(seed)
  })

  async function mountedActions() {
    const pinia = createPinia()
    setActivePinia(pinia)
    const queryClient = createQueryClient()
    const wrapper = mount(Harness, {
      global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] },
    })
    const store = useFlowStore()
    store.hydrate(normalizeNodes(seed))
    return { wrapper, store }
  }

  it('creates a standalone root and saves it through the fake API', async () => {
    const { wrapper, store } = await mountedActions()
    const result = await wrapper.vm.createNode({ type: 'sendMessage', title: 'Standalone' })
    await flushPromises()
    expect(result.ok).toBe(true)
    expect(store.getNode(result.id).parentId).toBeNull()
    expect(store.rootIds).toContain(result.id)
    const saved = normalizeNodes(await fetchFlow())
    expect(saved.find((node) => node.id === result.id)?.title).toBe('Standalone')
  })

  it('creates business hours connectors and saves the graph', async () => {
    const { wrapper, store } = await mountedActions()
    const result = await wrapper.vm.createNode({ type: 'businessHours', title: 'Night hours' })
    await flushPromises()
    const children = store.childrenOf(result.id)
    expect(children.map((child) => child.data.connectorType)).toEqual(['success', 'failure'])
    const edges = createFlowEdges(store.nodeList)
    expect(edges.filter((edge) => edge.source === result.id)).toHaveLength(2)
    expect(normalizeNodes(await fetchFlow()).some((node) => node.type === 'branch' && node.parentId === result.id)).toBe(true)
  })

  it('persists an update through the fake API', async () => {
    const { wrapper } = await mountedActions()
    const result = await wrapper.vm.updateNode('b6a0c1', { title: 'Saved title' })
    await flushPromises()
    expect(result.ok).toBe(true)
    const saved = normalizeNodes(await fetchFlow())
    expect(saved.find((node) => node.id === 'b6a0c1')?.title).toBe('Saved title')
  })

  it('deletes with domain semantics and persists the result', async () => {
    const { wrapper, store } = await mountedActions()
    const removed = await wrapper.vm.deleteNode('b6a0c1')
    await flushPromises()
    expect(removed.removedIds).toEqual(['b6a0c1'])
    expect(store.getNode('e879e4').parentId).toBeNull()
    expect(store.getNode('e879e4')).toBeTruthy()
  })
})

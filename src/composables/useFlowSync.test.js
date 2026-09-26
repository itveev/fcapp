import { flushPromises, mount } from '@vue/test-utils'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetFlowApi } from '../api/flowApi'
import { seed } from '../data/seed'
import { useFlowSync } from './useFlowSync'
import { useSaveFlowMutation } from '../queries/useFlowQuery'
import { createQueryClient } from '../queries/queryClient'
import { useFlowStore } from '../stores/flowStore'

const Harness = defineComponent({
  setup() {
    const sync = useFlowSync()
    const mutation = useSaveFlowMutation()
    return { sync, mutation }
  },
  template: '<div />',
})

describe('useFlowSync', () => {
  beforeEach(() => {
    resetFlowApi(seed)
  })

  it('hydrates the store once and ignores a later cache write', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const queryClient = createQueryClient()
    const wrapper = mount(Harness, {
      global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] },
    })
    await flushPromises()
    const store = useFlowStore()
    expect(store.hydrated).toBe(true)
    expect(store.nodeList).toHaveLength(7)

    await wrapper.vm.mutation.mutateAsync([{ id: 'only', parentId: -1, type: 'trigger', data: { type: 'conversationOpened', oncePerContact: false } }])
    await flushPromises()
    expect(store.nodeList).toHaveLength(7)
    expect(queryClient.getQueryData(['flow'])).toHaveLength(1)
  })
})

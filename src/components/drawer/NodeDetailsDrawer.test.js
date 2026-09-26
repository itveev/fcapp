import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import NodeDetailsDrawer from './NodeDetailsDrawer.vue'

const message = {
  id: 'b6a0c1',
  type: 'sendMessage',
  title: 'Away Message',
  description: '',
  data: { payload: [{ type: 'text', text: 'Sorry' }] },
}

describe('NodeDetailsDrawer', () => {
  it('disables Save while a mutation is pending', () => {
    const wrapper = mount(NodeDetailsDrawer, {
      props: { open: true, node: message, saving: true, canDelete: true },
    })
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('resets the title draft when the node id changes', async () => {
    const wrapper = mount(NodeDetailsDrawer, {
      props: { open: true, node: message, canDelete: true },
    })
    await wrapper.get('input[name="title"]').setValue('Temporary')
    await wrapper.setProps({
      node: { ...message, id: 'other', title: 'Welcome Message', data: { payload: [] } },
    })
    expect(wrapper.get('input[name="title"]').element.value).toBe('Welcome Message')
  })
})

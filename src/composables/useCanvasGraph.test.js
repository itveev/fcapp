import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { seed } from '../data/seed'
import { normalizeNodes } from '../utils/normalize'
import { useFlowStore } from '../stores/flowStore'
import { nodeFromActivationKey, useCanvasGraph } from './useCanvasGraph'

describe('useCanvasGraph', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useFlowStore().hydrate(normalizeNodes(seed))
  })

  it('derives edges from parentId and stores a position on drag stop', () => {
    const store = useFlowStore()
    const { edges, nodes, onDragStop } = useCanvasGraph()
    expect(edges.value.find((edge) => edge.target === 'd09c08')?.source).toBe('1')
    onDragStop({ node: { id: 'b0653a', position: { x: 30, y: 40 } } })
    expect(store.positions.b0653a).toEqual({ x: 30, y: 40 })
    expect(nodes.value.find((node) => node.id === 'b0653a').position).toEqual({ x: 30, y: 40 })
  })

  it('does not route inaccessible branch nodes', () => {
    const router = { push: vi.fn() }
    const { onNodeClick } = useCanvasGraph()
    onNodeClick(router, { node: { id: '161f52', data: { accessible: false } } })
    onNodeClick(router, { node: { id: 'b6a0c1', data: { accessible: true } } })
    expect(router.push).toHaveBeenCalledTimes(1)
    expect(router.push).toHaveBeenCalledWith({ name: 'node', params: { nodeId: 'b6a0c1' } })
  })

  it('opens the same route for Enter and Space on an accessible node', () => {
    const router = { push: vi.fn() }
    const { nodes, onNodeKeyDown } = useCanvasGraph()
    const message = nodes.value.find((node) => node.id === 'b6a0c1')
    const branch = nodes.value.find((node) => node.id === '161f52')
    const event = {
      key: 'Enter',
      preventDefault: vi.fn(),
      target: { classList: { contains: (name) => name === 'vue-flow__node' }, getAttribute: () => message.id },
    }
    onNodeKeyDown(router, event)
    event.key = ' '
    onNodeKeyDown(router, event)
    expect(router.push).toHaveBeenCalledTimes(2)
    expect(event.preventDefault).toHaveBeenCalledTimes(2)
    expect(nodeFromActivationKey({
      key: 'Enter',
      target: { classList: { contains: (name) => name === 'vue-flow__node' }, getAttribute: () => branch.id },
    }, nodes.value)).toBeNull()
  })
})

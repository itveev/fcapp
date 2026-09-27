import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { seed } from '../data/seed'
import { normalizeNodes } from '../utils/normalize'
import { useFlowStore } from './flowStore'

describe('flow store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function hydratedStore() {
    const store = useFlowStore()
    store.hydrate(normalizeNodes(seed))
    return store
  }

  it('hydrates once and ignores a later payload', () => {
    const store = hydratedStore()
    store.updateNode('b6a0c1', { title: 'Changed' })
    store.hydrate(normalizeNodes(seed))
    expect(store.getNode('b6a0c1').title).toBe('Changed')
  })

  it('creates a standalone node when parentId is omitted', () => {
    const store = hydratedStore()
    const created = store.createNode({ type: 'sendMessage', title: 'Hi' })
    expect(created.ok).toBe(true)
    expect(store.getNode(created.id).parentId).toBeNull()
    expect(store.rootIds).toContain(created.id)
  })

  it('creates business hours as a root with Success and Failure connectors', () => {
    const store = hydratedStore()
    const created = store.createNode({ type: 'businessHours', title: 'Night hours' })
    expect(created.ok).toBe(true)
    const node = store.getNode(created.id)
    expect(node.parentId).toBeNull()
    expect(store.rootIds).toContain(created.id)
    expect(node.data.connectors).toHaveLength(2)
    expect((store.childIdsByParentId[created.id] || []).map((id) => store.getNode(id).data.connectorType)).toEqual(['success', 'failure'])
  })

  it('updates message, comment, and business hours without dropping connectors', () => {
    const store = hydratedStore()
    expect(store.updateNode('b6a0c1', { title: '' }).ok).toBe(false)
    expect(store.getNode('b6a0c1').title).toBe('Away Message')
    store.updateNode('b6a0c1', { title: 'Away', description: 'Short', data: { payload: [{ type: 'text', text: 'Back soon' }] } })
    expect(store.getNode('b6a0c1')).toMatchObject({ title: 'Away', description: 'Short' })
    store.updateNode('e879e4', { data: { comment: '' } })
    expect(store.getNode('e879e4').data.comment).toBe('')
    const connectors = [...store.getNode('d09c08').data.connectors]
    const invalid = store.getNode('d09c08').data.times.map((row) => (
      row.day === 'mon' ? { ...row, startTime: '18:00', endTime: '09:00' } : row
    ))
    expect(store.updateNode('d09c08', { data: { times: invalid } }).ok).toBe(false)
    expect(store.getNode('d09c08').data.times[0].startTime).toBe('09:00')
    store.updateNode('d09c08', { data: { timezone: 'Europe/Moscow' } })
    expect(store.getNode('d09c08').data.connectors).toEqual(connectors)
    expect(store.getNode('d09c08').data.timezone).toBe('Europe/Moscow')
  })

  it('updates an editable node and refuses a read-only trigger', () => {
    const store = hydratedStore()
    expect(store.updateNode('1', { title: 'Nope' }).ok).toBe(false)
    expect(store.updateNode('b6a0c1', { description: 'Away copy' }).ok).toBe(true)
    expect(store.getNode('b6a0c1').description).toBe('Away copy')
  })

  it('promotes a direct child to root and keeps deeper links', () => {
    const store = useFlowStore()
    store.hydrate([
      { id: 'A', parentId: null, type: 'sendMessage', title: 'A', description: '', system: false, accessible: true, readOnly: false, data: { text: '', attachment: null } },
      { id: 'B', parentId: 'A', type: 'sendMessage', title: 'B', description: '', system: false, accessible: true, readOnly: false, data: { text: '', attachment: null } },
      { id: 'C', parentId: 'B', type: 'sendMessage', title: 'C', description: '', system: false, accessible: true, readOnly: false, data: { text: '', attachment: null } },
      { id: 'D', parentId: 'C', type: 'sendMessage', title: 'D', description: '', system: false, accessible: true, readOnly: false, data: { text: '', attachment: null } },
    ])
    const removed = store.deleteNode('B')
    expect(removed.removedIds).toEqual(['B'])
    expect(store.getNode('A')).toBeTruthy()
    expect(store.getNode('C').parentId).toBeNull()
    expect(store.rootIds).toEqual(expect.arrayContaining(['A', 'C']))
    expect(store.getNode('D').parentId).toBe('C')
    expect(store.positions.B).toBeUndefined()
    expect(store.positions.C).toBeTruthy()
  })

  it('removes business hours and its connectors, keeping user branches as roots', () => {
    const store = hydratedStore()
    expect(store.deleteNode('161f52').errors).toContainEqual({ field: 'id', code: 'system' })
    const removed = store.deleteNode('d09c08')
    expect(removed.removedIds).toEqual(['d09c08', '161f52', '28c4b9'])
    expect(store.getNode('b0653a').parentId).toBeNull()
    expect(store.getNode('b6a0c1').parentId).toBeNull()
    expect(store.rootIds).toEqual(expect.arrayContaining(['1', 'b0653a', 'b6a0c1']))
    expect(store.getNode('e879e4').parentId).toBe('b6a0c1')
    expect(store.positions.d09c08).toBeUndefined()
    expect(store.positions['161f52']).toBeUndefined()
    expect(store.positions.b6a0c1).toBeTruthy()
  })

  it('places a new root at a given position and leaves existing nodes', () => {
    const store = hydratedStore()
    const before = { ...store.positions['1'] }
    const created = store.createNode({ type: 'sendMessage', title: 'Here' }, { x: 40, y: 50 })
    expect(store.positions[created.id]).toEqual({ x: 40, y: 50 })
    expect(store.positions['1']).toEqual(before)
  })

  it('stores a dragged position', () => {
    const store = hydratedStore()
    store.setPosition('b0653a', { x: 12, y: 24 })
    expect(store.positions.b0653a).toEqual({ x: 12, y: 24 })
  })
})

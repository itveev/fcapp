import { describe, expect, it } from 'vitest'
import { seed } from '../data/seed'
import { normalizeNode, normalizeNodes, serializeNodes } from './normalize'

describe('normalizeNodes', () => {
  const nodes = normalizeNodes(seed)

  it('coerces the numeric trigger id and root parent', () => {
    const trigger = nodes.find((node) => node.id === '1')
    expect(trigger).toMatchObject({
      parentId: null,
      type: 'trigger',
      title: 'Trigger',
      system: true,
      accessible: true,
      readOnly: true,
      data: { triggerType: 'conversationOpened', oncePerContact: false },
    })
  })

  it('maps payload types onto the domain model', () => {
    expect(nodes.find((node) => node.id === 'd09c08').type).toBe('businessHours')
    expect(nodes.find((node) => node.id === '161f52')).toMatchObject({
      type: 'branch',
      accessible: false,
      readOnly: true,
      data: { connectorType: 'success' },
    })
    const away = nodes.find((node) => node.id === 'b6a0c1')
    expect(away.data.payload).toEqual([
      { type: 'text', text: 'Sorry, we are currently away. We will respond as soon as possible.' },
    ])
    const welcome = nodes.find((node) => node.id === 'b0653a')
    expect(welcome.data.payload.map((item) => item.type)).toEqual(['text', 'attachment'])
    expect(welcome.data.payload[1].name).toBe('354.jpg')
  })

  it('repairs connector order from parent links', () => {
    const raw = structuredClone(seed)
    raw.find((node) => node.id === 'd09c08').data.connectors = ['28c4b9', '161f52']
    const hours = normalizeNodes(raw).find((node) => node.id === 'd09c08')
    expect(hours.data.connectors).toEqual(['161f52', '28c4b9'])
  })

  it('round-trips through the assessment payload shape', () => {
    expect(normalizeNodes(serializeNodes(nodes))).toEqual(nodes)
    const payload = serializeNodes(nodes)
    expect(payload.find((node) => node.type === 'trigger').id).toBe('1')
    expect(payload.find((node) => node.type === 'trigger').parentId).toBe(-1)
    expect(payload.find((node) => node.id === 'd09c08')).toMatchObject({
      type: 'dateTime',
      parentId: '1',
      data: { action: 'businessHours', timezone: 'UTC' },
    })
  })
})

describe('normalizeNode', () => {
  it('fills a title when name is missing', () => {
    expect(normalizeNode({ id: 1, parentId: -1, type: 'trigger', data: { type: 'conversationOpened' } }).title).toBe('Trigger')
  })

  it('keeps an unknown type and a dateTime that is not business hours', () => {
    const unknown = normalizeNode({ id: 'x', parentId: null, type: 'custom' })
    expect(unknown).toMatchObject({ type: 'custom', title: 'Node', data: {} })
    expect(serializeNodes([unknown])[0]).toMatchObject({ type: 'custom', parentId: -1, data: {}, name: 'Node' })
    expect(normalizeNode({ id: 't', type: 'dateTime', data: {} }).type).toBe('dateTime')
  })
})

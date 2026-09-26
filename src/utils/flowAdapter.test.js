import { describe, expect, it } from 'vitest'
import { seed } from '../data/seed'
import { createFlowEdges, createFlowNodes, getNodePreview } from './flowAdapter'
import { normalizeNodes } from './normalize'

const nodes = normalizeNodes(seed)

describe('flow adapter', () => {
  it('builds display nodes without domain payload fields', () => {
    const [trigger, hours] = createFlowNodes(nodes, { 1: { x: 1, y: 2 } })
    expect(trigger).toMatchObject({
      id: '1',
      type: 'workflowCard',
      draggable: true,
      connectable: false,
      data: { title: 'Trigger', nodeType: 'trigger', accessible: true, readOnly: true, preview: 'Conversation Opened' },
    })
    expect(hours.data.times).toBeUndefined()
    expect(createFlowNodes(nodes, {}).find((node) => node.id === '161f52').type).toBe('branchPill')
  })

  it('keeps workflow nodes interactive and branch nodes display-only', () => {
    const flowNodes = createFlowNodes(nodes, {})
    expect(flowNodes.find((node) => node.id === '1')).toMatchObject({
      draggable: true,
      selectable: true,
      focusable: true,
      data: { accessible: true, readOnly: true },
    })
    expect(flowNodes.find((node) => node.id === 'b6a0c1')).toMatchObject({
      draggable: true,
      selectable: true,
      focusable: true,
    })
    expect(flowNodes.find((node) => node.id === '161f52')).toMatchObject({
      draggable: false,
      selectable: false,
      focusable: false,
      data: { connectorType: 'success', accessible: false },
    })
    expect(flowNodes.find((node) => node.id === '28c4b9')).toMatchObject({
      selectable: false,
      focusable: false,
      data: { connectorType: 'failure' },
    })
  })

  it('creates edges from parentId', () => {
    const edges = createFlowEdges(nodes)
    expect(edges).toHaveLength(6)
    expect(edges.find((edge) => edge.target === 'd09c08')).toMatchObject({
      id: 'e-1-d09c08',
      source: '1',
      sourcePosition: 'bottom',
      targetPosition: 'top',
    })
  })

  it('prefers a description and otherwise truncates type content', () => {
    const message = nodes.find((node) => node.id === 'b6a0c1')
    expect(getNodePreview({ ...message, description: 'x'.repeat(90) }).endsWith('…')).toBe(true)
    expect(getNodePreview(message)).toContain('currently away')
  })
})

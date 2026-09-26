import { describe, expect, it } from 'vitest'
import { seed } from '../data/seed'
import { normalizeNodes } from './normalize'
import { buildTreeIndex, getNodeChildren, getNodeDescendants } from './tree'

const index = buildTreeIndex(normalizeNodes(seed))

describe('tree index', () => {
  it('looks up a node and its children without scanning', () => {
    expect(index.nodesById.d09c08.title).toBe('Business Hours')
    expect(getNodeChildren(index, 'd09c08').map((node) => node.id)).toEqual(['161f52', '28c4b9'])
    expect(getNodeChildren(index, '28c4b9').map((node) => node.id)).toEqual(['b6a0c1'])
  })

  it('collects descendants', () => {
    expect(getNodeDescendants(index, 'b6a0c1').map((node) => node.id)).toEqual(['e879e4'])
    expect(getNodeDescendants(index, '1')).toHaveLength(6)
    expect(index.rootIds).toEqual(['1'])
  })
})

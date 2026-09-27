import { describe, expect, it } from 'vitest'
import { seed } from '../data/seed'
import { normalizeNodes } from './normalize'
import { buildTreeIndex } from './tree'

const index = buildTreeIndex(normalizeNodes(seed))

describe('tree index', () => {
  it('indexes nodes, children, and roots', () => {
    expect(index.nodesById.d09c08.title).toBe('Business Hours')
    expect(index.childIdsByParentId.d09c08).toEqual(['161f52', '28c4b9'])
    expect(index.childIdsByParentId['28c4b9']).toEqual(['b6a0c1'])
    expect(index.rootIds).toEqual(['1'])
  })
})

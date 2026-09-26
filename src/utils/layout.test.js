import { describe, expect, it } from 'vitest'
import { seed } from '../data/seed'
import { GAP_Y, calculateInitialPositions } from './layout'
import { normalizeNodes } from './normalize'
import { buildTreeIndex } from './tree'

const nodes = normalizeNodes(seed)
const index = buildTreeIndex(nodes)

describe('calculateInitialPositions', () => {
  it('is deterministic and separates siblings by level', () => {
    const first = calculateInitialPositions(nodes, index, {})
    const second = calculateInitialPositions(nodes, index, {})
    expect(second).toEqual(first)
    expect(first['1'].y).toBe(0)
    expect(first.d09c08.y).toBe(GAP_Y)
    expect(first['161f52'].x).not.toBe(first['28c4b9'].x)
    expect(new Set(Object.values(first).map((position) => `${position.x},${position.y}`)).size).toBe(nodes.length)
  })

  it('keeps an existing position and places new descendants under it', () => {
    const positions = calculateInitialPositions(nodes, index, { 1: { x: 500, y: 80 } })
    expect(positions['1']).toEqual({ x: 500, y: 80 })
    expect(positions.d09c08.y).toBe(80 + GAP_Y)
    expect(positions['161f52'].y).toBe(positions.d09c08.y + GAP_Y)
  })
})

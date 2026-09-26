import { describe, expect, it } from 'vitest'
import { isNodeVisible } from './nodeVisibility'

const bounds = { left: 0, top: 0, right: 400, bottom: 300 }
const node = { topLeft: { x: 20, y: 20 }, size: { width: 200, height: 100 }, bounds }

describe('isNodeVisible', () => {
  it('uses flow size as screen size at zoom 1', () => {
    expect(isNodeVisible({ ...node, zoom: 1 })).toBe(true)
    expect(isNodeVisible({ ...node, zoom: 1, topLeft: { x: 300, y: 20 } })).toBe(false)
  })

  it('treats the same node as visible when zoom shrinks it', () => {
    expect(isNodeVisible({ ...node, zoom: 1, topLeft: { x: 250, y: 20 } })).toBe(false)
    expect(isNodeVisible({ ...node, zoom: 0.5, topLeft: { x: 250, y: 20 } })).toBe(true)
  })

  it('treats the same node as clipped when zoom enlarges it', () => {
    expect(isNodeVisible({ ...node, zoom: 1 })).toBe(true)
    expect(isNodeVisible({ ...node, zoom: 2 })).toBe(false)
  })
})

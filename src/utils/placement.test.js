import { describe, expect, it } from 'vitest'
import { placeNearCenter } from './placement'

describe('placeNearCenter', () => {
  it('puts the first node on the viewport center', () => {
    expect(placeNearCenter({ x: 400, y: 300 }, 0)).toEqual({ x: 290, y: 256 })
  })

  it('keeps later nodes in a bounded cascade', () => {
    const positions = Array.from({ length: 20 }, (_, slot) => placeNearCenter({ x: 400, y: 300 }, slot))
    const xs = positions.map((position) => position.x)
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(56 * 2)
    expect(new Set(positions.map((position) => `${position.x},${position.y}`)).size).toBe(8)
  })
})
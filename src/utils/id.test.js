import { describe, expect, it } from 'vitest'
import { createNodeId } from './id'

describe('createNodeId', () => {
  it('returns an unused 6-character hex id', () => {
    const taken = new Set(['abc123'])
    const id = createNodeId(taken)
    expect(id).toMatch(/^[0-9a-f]{6}$/)
    expect(taken.has(id)).toBe(false)
  })
})

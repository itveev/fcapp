import { beforeEach, describe, expect, it } from 'vitest'
import { seed } from '../data/seed'
import { normalizeNodes, serializeNodes } from '../utils/normalize'
import { fetchFlow, resetFlowApi, saveFlow } from './flowApi'

describe('flowApi', () => {
  beforeEach(() => {
    resetFlowApi(seed)
  })

  it('returns a clone and saves the next payload', async () => {
    const first = await fetchFlow()
    first.pop()
    expect(await fetchFlow()).toHaveLength(7)
    const domain = normalizeNodes(seed)
    await saveFlow(serializeNodes(domain))
    expect(normalizeNodes(await fetchFlow())).toEqual(domain)
  })
})

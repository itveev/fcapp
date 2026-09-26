import { describe, expect, it } from 'vitest'
import { resolveDrawer } from './drawerState'

const trigger = { id: '1', accessible: true, readOnly: true, system: true }
const message = { id: 'b6a0c1', accessible: true, readOnly: false, system: false }
const branch = { id: '161f52', accessible: false, readOnly: true, system: true }

describe('resolveDrawer', () => {
  it('keeps the drawer closed on the canvas route', () => {
    expect(resolveDrawer({ nodeId: '', node: null, hydrated: true }).status).toBe('closed')
  })

  it('opens an accessible node and keeps the trigger read-only', () => {
    expect(resolveDrawer({ nodeId: 'b6a0c1', node: message, hydrated: true })).toMatchObject({
      status: 'open',
      readOnly: false,
      canDelete: true,
    })
    expect(resolveDrawer({ nodeId: '1', node: trigger, hydrated: true })).toMatchObject({
      status: 'open',
      readOnly: true,
      canDelete: false,
    })
  })

  it('does not open an inaccessible branch and waits for hydration', () => {
    expect(resolveDrawer({ nodeId: '161f52', node: branch, hydrated: true }).status).toBe('inaccessible')
    expect(resolveDrawer({ nodeId: 'b6a0c1', node: null, hydrated: false }).status).toBe('pending')
  })

  it('reports a missing node without throwing', () => {
    expect(resolveDrawer({ nodeId: 'missing', node: null, hydrated: true }).status).toBe('missing')
  })
})

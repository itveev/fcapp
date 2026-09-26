import { describe, expect, it } from 'vitest'
import { defaultBusinessHoursTimes } from './businessHours'
import { validateBusinessHours, validateCreateInput, validateNode } from './validation'

describe('validation', () => {
  it('allows a create input without parentId', () => {
    expect(validateCreateInput({ title: 'Hello', type: 'sendMessage' })).toEqual([])
  })

  it('requires a title and a user node type', () => {
    const errors = validateCreateInput({ parentId: '1', title: '  ', type: 'trigger' })
    expect(errors).toEqual(expect.arrayContaining([
      { field: 'title', code: 'required' },
      { field: 'type', code: 'type' },
    ]))
  })

  it('rejects an incomplete or reversed time range and accepts a closed day', () => {
    const times = defaultBusinessHoursTimes()
    times[0] = { day: 'mon', startTime: '17:00', endTime: '09:00' }
    expect(validateBusinessHours({ timezone: 'UTC', times })).toContainEqual({ field: 'mon', code: 'range' })
    times[0] = { day: 'mon', startTime: '09:00', endTime: '' }
    expect(validateBusinessHours({ timezone: 'UTC', times })).toContainEqual({ field: 'mon', code: 'incomplete' })
    times[0] = { day: 'mon', startTime: '', endTime: '' }
    expect(validateBusinessHours({ timezone: 'UTC', times })).toEqual([])
    expect(validateBusinessHours({ timezone: '', times })).toContainEqual({ field: 'timezone', code: 'timezone' })
  })

  it('accepts a timezone that is outside the short UI list', () => {
    const times = defaultBusinessHoursTimes()
    expect(validateBusinessHours({ timezone: 'Asia/Kolkata', times })).toEqual([])
  })

  it('limits message and description length', () => {
    expect(validateNode({
      type: 'sendMessage',
      title: 'Hello',
      description: 'x'.repeat(281),
      data: { payload: [{ type: 'text', text: 'y'.repeat(2001) }] },
    })).toEqual(expect.arrayContaining([
      { field: 'description', code: 'maxLength' },
      { field: 'text', code: 'maxLength' },
    ]))
  })
})

import { describe, expect, it } from 'vitest'
import { defaultBusinessHoursTimes } from './businessHours'
import { formatValidationError, validateBusinessHours, validateCreateInput, validateNode } from './validation'

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

  it('dispatches node data validation by type', () => {
    expect(validateNode({
      type: 'addComment',
      title: 'Note',
      data: { comment: 'x'.repeat(501) },
    })).toEqual([{ field: 'comment', code: 'maxLength' }])
    expect(validateNode({ type: 'trigger', title: 'Opened' })).toEqual([])
  })

  it('validates business hours data on a node even when data is missing', () => {
    expect(validateNode({ type: 'businessHours', title: 'Hours' })).toEqual([
      { field: 'timezone', code: 'timezone' },
      { field: 'times', code: 'required' },
    ])
    expect(validateCreateInput({ title: 'Hours', type: 'businessHours' })).toEqual([])
  })

  it('validates create input data when present', () => {
    expect(validateCreateInput({
      title: 'Note',
      type: 'addComment',
      data: { comment: 'x'.repeat(501) },
    })).toEqual([{ field: 'comment', code: 'maxLength' }])
  })

  it('formats known error codes and falls back for an unknown code', () => {
    expect(formatValidationError({ field: 'title', code: 'required' })).toBe('Title is required.')
    expect(formatValidationError({ field: 'times', code: 'required' })).toBe('times is required.')
    expect(formatValidationError({ field: 'text', code: 'maxLength' })).toBe('text is too long.')
    expect(formatValidationError({ field: 'mon', code: 'range' })).toBe('mon: end time must be after start time.')
    expect(formatValidationError({ field: 'mon', code: 'incomplete' })).toBe('mon: enter both start and end.')
    expect(formatValidationError({ field: 'timezone', code: 'timezone' })).toBe('Time zone is required.')
    expect(formatValidationError({ field: 'mon', code: 'time' })).toBe('mon: enter a valid time.')
    expect(formatValidationError({ field: 'type', code: 'type' })).toBe('Choose a node type.')
    expect(formatValidationError({ field: 'parentId', code: 'missing' })).toBe('parentId missing')
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

import { describe, expect, it } from 'vitest'
import { isImageAttachment, replaceAttachment, urlsToRevoke } from './attachments'

describe('replaceAttachment', () => {
  it('replaces an existing attachment in place and appends one when missing', () => {
    const textA = { type: 'text', text: 'A' }
    const textB = { type: 'text', text: 'B' }
    const current = { type: 'attachment', url: 'old' }
    const next = { type: 'attachment', url: 'new' }
    expect(replaceAttachment([textA, current, textB], next)).toEqual([textA, next, textB])
    expect(replaceAttachment([textA, textB], next)).toEqual([textA, textB, next])
  })
})

describe('isImageAttachment', () => {
  it('recognizes a remote image url and a local file name separately', () => {
    expect(isImageAttachment({
      name: '354.jpg',
      url: 'https://fastly.picsum.photos/id/396/536/354.jpg?hmac=abc',
    })).toBe(true)
    expect(isImageAttachment({
      name: 'igra_voin_world_of_warcraft_wrath_of_the_lich_king_94753_1920x1080.jpg',
      url: 'blob:http://localhost/local',
    })).toBe(true)
    expect(isImageAttachment({ name: 'notes.txt', url: 'blob:http://localhost/local' })).toBe(false)
  })
})

describe('urlsToRevoke', () => {
  it('revokes only local urls that are no longer kept', () => {
    const created = new Set(['blob:new', 'blob:replaced'])
    expect(urlsToRevoke(created, new Set(['blob:new']))).toEqual(['blob:replaced'])
    expect(urlsToRevoke(created, new Set(['blob:new', 'blob:replaced']))).toEqual([])
  })
})

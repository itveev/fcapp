import { WEEK_DAYS, isValidTime } from './businessHours'

const USER_TYPES = ['sendMessage', 'addComment', 'businessHours']

export function validateTitle(title) {
  const value = typeof title === 'string' ? title.trim() : ''
  if (!value) return [{ field: 'title', code: 'required' }]
  if (value.length > 80) return [{ field: 'title', code: 'maxLength' }]
  return []
}

export function validateDescription(description) {
  const value = description == null ? '' : String(description).trim()
  if (value.length > 280) return [{ field: 'description', code: 'maxLength' }]
  return []
}

export function validateBusinessHours(data) {
  const errors = []
  if (!data || !String(data.timezone ?? '').trim()) {
    errors.push({ field: 'timezone', code: 'timezone' })
  }
  if (!Array.isArray(data?.times)) {
    errors.push({ field: 'times', code: 'required' })
    return errors
  }

  const seen = new Set()
  for (const row of data.times) {
    if (!WEEK_DAYS.includes(row?.day)) {
      errors.push({ field: 'day', code: 'day' })
      continue
    }
    if (seen.has(row.day)) errors.push({ field: row.day, code: 'duplicate' })
    seen.add(row.day)

    const start = String(row.startTime ?? '').trim()
    const end = String(row.endTime ?? '').trim()
    if (!start && !end) continue
    if (!start || !end) {
      errors.push({ field: row.day, code: 'incomplete' })
      continue
    }
    if (!isValidTime(start) || !isValidTime(end)) {
      errors.push({ field: row.day, code: 'time' })
      continue
    }
    if (start >= end) errors.push({ field: row.day, code: 'range' })
  }

  return errors
}

export function validateSendMessage(data) {
  const errors = []
  const payload = data?.payload || []
  for (const item of payload) {
    if (item?.type === 'text' && (typeof item.text !== 'string' || item.text.length > 2000)) {
      errors.push({ field: 'text', code: 'maxLength' })
    }
    if (item?.type === 'attachment') {
      if (!item.url || typeof item.url !== 'string') errors.push({ field: 'attachment', code: 'attachment' })
      if (item.kind && item.kind !== 'remote' && item.kind !== 'local') {
        errors.push({ field: 'attachment', code: 'attachment' })
      }
    }
  }
  return errors
}

export function validateComment(data) {
  const comment = data?.comment ?? ''
  if (typeof comment !== 'string' || comment.length > 500) {
    return [{ field: 'comment', code: 'maxLength' }]
  }
  return []
}

export function validateNode(node) {
  const errors = [
    ...validateTitle(node?.title),
    ...validateDescription(node?.description),
  ]
  if (node?.type === 'sendMessage') errors.push(...validateSendMessage(node.data))
  if (node?.type === 'addComment') errors.push(...validateComment(node.data))
  if (node?.type === 'businessHours') errors.push(...validateBusinessHours(node.data))
  return errors
}

export function formatValidationError(error) {
  if (error.code === 'required') return 'Title is required.'
  if (error.code === 'maxLength') return `${error.field} is too long.`
  if (error.code === 'range') return `${error.field}: end time must be after start time.`
  if (error.code === 'incomplete') return `${error.field}: enter both start and end.`
  if (error.code === 'timezone') return 'Time zone is required.'
  if (error.code === 'time') return `${error.field}: enter a valid time.`
  if (error.code === 'type') return 'Choose a node type.'
  return `${error.field} ${error.code}`
}

export function validateCreateInput(input) {
  const errors = []
  if (!USER_TYPES.includes(input?.type)) errors.push({ field: 'type', code: 'type' })
  errors.push(...validateTitle(input?.title))
  errors.push(...validateDescription(input?.description ?? ''))
  if (input?.data && input?.type === 'sendMessage') errors.push(...validateSendMessage(input.data))
  if (input?.data && input?.type === 'addComment') errors.push(...validateComment(input.data))
  if (input?.data && input?.type === 'businessHours') errors.push(...validateBusinessHours(input.data))
  return errors
}

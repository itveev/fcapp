export const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export const TIMEZONES = [
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'Europe/Moscow',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
]

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export function defaultBusinessHoursTimes() {
  return WEEK_DAYS.map((day) => ({
    day,
    startTime: '09:00',
    endTime: '17:00',
  }))
}

export function isValidTime(value) {
  return TIME_PATTERN.test(value)
}

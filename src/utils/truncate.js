export function truncate(value, max = 80) {
  const text = String(value ?? '')
  if (text.length <= max) return text
  if (max <= 1) return '…'
  return `${text.slice(0, max - 1)}…`
}

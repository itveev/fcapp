export function attachmentNameFromFile(file) {
  return file?.name || 'attachment'
}

export function createLocalAttachment(file) {
  return {
    type: 'attachment',
    url: URL.createObjectURL(file),
    name: attachmentNameFromFile(file),
    kind: 'local',
  }
}

const IMAGE_URL = /\.(png|jpe?g|gif|webp|svg)(\?|#|$)/i

export function isImageAttachment(item) {
  return IMAGE_URL.test(item?.name || '') || IMAGE_URL.test(item?.url || '')
}

export function replaceAttachment(payload, attachment) {
  const index = payload.findIndex((item) => item?.type === 'attachment')
  if (index === -1) return [...payload, attachment]
  return payload.map((item, itemIndex) => (itemIndex === index ? attachment : item))
}

export function urlsToRevoke(createdUrls, keptUrls) {
  return [...createdUrls].filter((url) => !keptUrls.has(url))
}

export function revokeUrls(urls) {
  for (const url of urls) URL.revokeObjectURL(url)
}

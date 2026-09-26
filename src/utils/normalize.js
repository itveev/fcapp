import { buildTreeIndex } from './tree'

function attachmentName(url) {
  try {
    const segment = new URL(url).pathname.split('/').filter(Boolean).pop()
    return segment || 'attachment'
  } catch {
    return 'attachment'
  }
}

function mapType(raw) {
  if (raw.type === 'dateTime' && raw.data?.action === 'businessHours') return 'businessHours'
  if (raw.type === 'dateTimeConnector') return 'branch'
  return raw.type
}

function defaultTitle(type, raw) {
  if (type === 'trigger') return 'Trigger'
  if (type === 'branch') return raw.data?.connectorType === 'failure' ? 'Failure' : 'Success'
  if (type === 'sendMessage') return 'Send Message'
  if (type === 'addComment') return 'Add Comment'
  if (type === 'businessHours') return 'Business Hours'
  return 'Node'
}

function parentIdFromRaw(parentId) {
  if (parentId == null || parentId === -1 || parentId === '-1') return null
  return String(parentId)
}

function sendMessageData(raw) {
  const payload = []
  for (const part of raw.data?.payload || []) {
    if (part.type === 'text') payload.push({ type: 'text', text: part.text || '' })
    if (part.type === 'attachment' && part.attachment) {
      payload.push({
        type: 'attachment',
        url: part.attachment,
        name: attachmentName(part.attachment),
        kind: 'remote',
      })
    }
  }
  return { payload }
}

function businessHoursData(raw) {
  return {
    timezone: raw.data?.timezone || 'UTC',
    times: (raw.data?.times || []).map((row) => ({
      day: row.day,
      startTime: row.startTime,
      endTime: row.endTime,
    })),
    connectors: (raw.data?.connectors || []).map(String),
  }
}

export function normalizeNode(raw) {
  const type = mapType(raw)
  const system = type === 'trigger' || type === 'branch'
  let data = {}
  if (type === 'trigger') {
    data = { triggerType: raw.data?.type || '', oncePerContact: Boolean(raw.data?.oncePerContact) }
  } else if (type === 'sendMessage') {
    data = sendMessageData(raw)
  } else if (type === 'addComment') {
    data = { comment: raw.data?.comment || '' }
  } else if (type === 'businessHours') {
    data = businessHoursData(raw)
  } else if (type === 'branch') {
    data = { connectorType: raw.data?.connectorType }
  }

  return {
    id: String(raw.id),
    parentId: parentIdFromRaw(raw.parentId),
    type,
    title: raw.name?.trim() || defaultTitle(type, raw),
    description: typeof raw.description === 'string' ? raw.description : '',
    system,
    // Success/Failure are non-accessible by the assessment.
    // Trigger stays accessible. Treating it as read-only is an assumption:
    // the task does not define how to edit it.
    accessible: type !== 'branch',
    readOnly: system,
    data,
  }
}

function repairConnectors(nodes) {
  const index = buildTreeIndex(nodes)
  return nodes.map((node) => {
    if (node.type !== 'businessHours') return node
    const branches = (index.childIdsByParentId[node.id] || [])
      .map((id) => index.nodesById[id])
      .filter((child) => child?.type === 'branch')
    const connectors = [
      ...branches.filter((child) => child.data.connectorType === 'success').map((child) => child.id),
      ...branches.filter((child) => child.data.connectorType === 'failure').map((child) => child.id),
    ]
    return {
      ...node,
      data: {
        ...node.data,
        connectors: connectors.length ? connectors : node.data.connectors,
      },
    }
  })
}

export function normalizeNodes(rawNodes) {
  return repairConnectors(rawNodes.map(normalizeNode))
}

function serializeData(node) {
  if (node.type === 'trigger') {
    return { type: node.data.triggerType, oncePerContact: node.data.oncePerContact }
  }
  if (node.type === 'sendMessage') {
    const payload = (node.data.payload || []).flatMap((item) => {
      if (item.type === 'text') return [{ type: 'text', text: item.text || '' }]
      if (item.type === 'attachment' && item.url) return [{ type: 'attachment', attachment: item.url }]
      return []
    })
    return { payload }
  }
  if (node.type === 'addComment') return { comment: node.data.comment }
  if (node.type === 'businessHours') {
    return {
      times: node.data.times.map((row) => ({
        startTime: row.startTime,
        endTime: row.endTime,
        day: row.day,
      })),
      connectors: [...node.data.connectors],
      timezone: node.data.timezone,
      action: 'businessHours',
    }
  }
  if (node.type === 'branch') return { connectorType: node.data.connectorType }
  return {}
}

function serializeType(node) {
  if (node.type === 'businessHours') return 'dateTime'
  if (node.type === 'branch') return 'dateTimeConnector'
  return node.type
}

export function serializeNodes(nodes) {
  return nodes.map((node) => {
    const payload = {
      id: node.id,
      parentId: node.parentId == null ? -1 : node.parentId,
      type: serializeType(node),
      data: serializeData(node),
    }
    if (node.type !== 'trigger') payload.name = node.title
    if (node.description) payload.description = node.description
    return payload
  })
}

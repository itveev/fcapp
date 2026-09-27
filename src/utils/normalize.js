import { buildTreeIndex } from './tree'

function attachmentName(url) {
  try {
    const segment = new URL(url).pathname.split('/').filter(Boolean).pop()
    return segment || 'attachment'
  } catch {
    return 'attachment'
  }
}

// The payload uses dateTime/dateTimeConnector. The domain uses businessHours/branch.
// A dateTime node is businessHours only when its action says so.
const domainTypeByApiType = {
  dateTimeConnector: 'branch',
}

const apiTypeByDomainType = {
  businessHours: 'dateTime',
  branch: 'dateTimeConnector',
}

function mapType(raw) {
  if (raw.type === 'dateTime' && raw.data?.action === 'businessHours') return 'businessHours'
  return domainTypeByApiType[raw.type] ?? raw.type
}

function serializeType(node) {
  return apiTypeByDomainType[node.type] ?? node.type
}

const defaultTitles = {
  trigger: 'Trigger',
  sendMessage: 'Send Message',
  addComment: 'Add Comment',
  businessHours: 'Business Hours',
}

function defaultTitle(type, raw) {
  if (type === 'branch') return raw.data?.connectorType === 'failure' ? 'Failure' : 'Success'
  return defaultTitles[type] ?? 'Node'
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

const dataNormalizers = {
  trigger: (raw) => ({
    triggerType: raw.data?.type || '',
    oncePerContact: Boolean(raw.data?.oncePerContact),
  }),
  sendMessage: sendMessageData,
  addComment: (raw) => ({ comment: raw.data?.comment || '' }),
  businessHours: businessHoursData,
  branch: (raw) => ({ connectorType: raw.data?.connectorType }),
}

function normalizeData(type, raw) {
  const normalize = dataNormalizers[type]
  if (!normalize) return {}
  return normalize(raw)
}

export function normalizeNode(raw) {
  const type = mapType(raw)
  const system = type === 'trigger' || type === 'branch'
  const data = normalizeData(type, raw)

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

// The payload records a Business Hours split twice: branch parentId and data.connectors.
// Prefer the actual branch children so the domain connectors stay in agreement with the tree.
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

function serializeSendMessage(node) {
  const payload = (node.data.payload || []).flatMap((item) => {
    if (item.type === 'text') return [{ type: 'text', text: item.text || '' }]
    if (item.type === 'attachment' && item.url) return [{ type: 'attachment', attachment: item.url }]
    return []
  })
  return { payload }
}

function serializeBusinessHours(node) {
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

const dataSerializers = {
  trigger: (node) => ({ type: node.data.triggerType, oncePerContact: node.data.oncePerContact }),
  sendMessage: serializeSendMessage,
  addComment: (node) => ({ comment: node.data.comment }),
  businessHours: serializeBusinessHours,
  branch: (node) => ({ connectorType: node.data.connectorType }),
}

function serializeData(node) {
  const serialize = dataSerializers[node.type]
  if (!serialize) return {}
  return serialize(node)
}

// Domain-only fields (system, accessible, readOnly, attachment kind/name) do not go back into the payload.
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
